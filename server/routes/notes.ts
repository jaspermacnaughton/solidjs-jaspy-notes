import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { getPostgresClient } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import type { AuthedContext } from '../middleware/auth';

const noteSchema = z.object({
  note_id: z.number().int(),
  title: z.string().min(3).max(255),
  body: z.string()
})

const updateNoteSchema = z.object({
  note_id: z.number().int(),
  body: z.string(),
  subitems: z.array(z.object({
    text: z.string(),
    is_checked: z.boolean()
  }))
});

const createNoteSchema = noteSchema.omit({
  note_id: true
});

const deleteNoteSchema = z.object({
  note_id: z.number().int()
});

const updateSubitemSchema = z.object({
  is_checked: z.boolean()
});

export const notesRoute = new Hono()
  .use('/*', authMiddleware)
  .get('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      await postgresClient.connect();
      
      // First get all notes
      const notesRes = await postgresClient.query(
        `SELECT note_id, title, body 
        FROM public."Notes" 
        WHERE user_id = $1 
        ORDER BY note_id ASC`,
        [c.user!.user_id]
      );

      // Then get all subitems for these notes
      const subitemsRes = await postgresClient.query(
        `SELECT subitem_id, note_id, text, is_checked 
        FROM public."Subitems" 
        WHERE note_id = ANY($1)
        ORDER BY subitem_id ASC`,
        [notesRes.rows.map(note => note.note_id)]
      );

      // Combine notes with their subitems
      const notes = notesRes.rows.map(note => ({
        ...note,
        subitems: subitemsRes.rows.filter(subitem => subitem.note_id === note.note_id)
      }));
      
      return c.json({ success: true, notes });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .post('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { title, body } = await c.req.json();
      
      await postgresClient.connect();
      
      const res = await postgresClient.query(
        `INSERT INTO public."Notes" (user_id, title, body) 
        VALUES ($1, $2, $3)
        RETURNING note_id`,
        [c.user!.user_id, title, body]
      );
      
      return c.json({ success: true, note_id: res.rows[0].note_id });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .delete('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { note_id } = await c.req.json();
      
      await postgresClient.connect();
      
      const res = await postgresClient.query(
        `DELETE FROM public."Notes"
        WHERE note_id = $1 AND user_id = $2
        RETURNING note_id`,
        [note_id, c.user!.user_id]
      );
      
      if (res.rowCount === 0) {
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .put('/', zValidator('json', updateNoteSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { note_id, body, subitems } = await c.req.json();
      
      await postgresClient.connect();
      
      // Start a transaction since we're doing multiple operations
      await postgresClient.query('BEGIN');
      
      // First verify the note belongs to the user
      const noteExistsCheck = await postgresClient.query(
        `SELECT note_id FROM public."Notes" 
        WHERE note_id = $1 AND user_id = $2`,
        [note_id, c.user!.user_id]
      );
      
      if (noteExistsCheck.rows.length === 0) {
        await postgresClient.query('ROLLBACK');
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      // Update the note body
      await postgresClient.query(
        `UPDATE public."Notes" 
        SET body = $1 
        WHERE note_id = $2`,
        [body, note_id]
      );
      
      // Delete all existing subitems for this note
      await postgresClient.query(
        `DELETE FROM public."Subitems" 
        WHERE note_id = $1`,
        [note_id]
      );
      
      // Insert all new/updated subitems
      if (subitems.length > 0) {
        // Create placeholders for each subitem: (note_id, text, is_checked)
        const values = subitems.map((_: { text: string, is_checked: boolean }, index: number) => {
          const textParam = index * 2 + 2;        // 2, 4, 6, etc.
          const checkedParam = index * 2 + 3;     // 3, 5, 7, etc.
          return `($1, $${textParam}, $${checkedParam})`;
        }).join(', ');
        
        const params = [note_id];
        subitems.forEach((item: { text: string, is_checked: boolean }) => {
          params.push(item.text, item.is_checked);
        });
        
        const newSubitemsRes = await postgresClient.query(
          `INSERT INTO public."Subitems" (note_id, text, is_checked)
          VALUES ${values}
          RETURNING subitem_id, text, is_checked`,
          params
        );
      
        await postgresClient.query('COMMIT');
        return c.json({ 
          success: true, 
          subitems: newSubitemsRes.rows 
        });
      }
      
      await postgresClient.query('COMMIT');
      return c.json({ success: true, subitems: [] });
      
    } catch (err) {
      await postgresClient.query('ROLLBACK');
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .patch('/subitems/:subitem_id', zValidator('json', updateSubitemSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    console.log("Updating subitem");
    
    try {
      const subitemId = Number(c.req.param('subitem_id'));
      const { is_checked } = await c.req.json();
      
      console.log(subitemId, is_checked);
      
      await postgresClient.connect();
      
      // First verify the subitem belongs to a note owned by the user
      const verifyRes = await postgresClient.query(
        `SELECT s.subitem_id 
         FROM public."Subitems" s
         JOIN public."Notes" n ON s.note_id = n.note_id
         WHERE s.subitem_id = $1 AND n.user_id = $2`,
        [subitemId, c.user!.user_id]
      );
      
      if (verifyRes.rows.length === 0) {
        return c.json({ success: false, error: 'Subitem not found or unauthorized' }, 404);
      }
      
      // Update the subitem
      await postgresClient.query(
        `UPDATE public."Subitems" 
         SET is_checked = $1 
         WHERE subitem_id = $2`,
        [is_checked, subitemId]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  });