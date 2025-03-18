import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { getPostgresClient } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import type { AuthedContext } from '../middleware/auth';

const noteSchema = z.object({
  note_id: z.number().int(),
  title: z.string().min(3).max(255),
  body: z.string(),
  note_type: z.enum(['freetext', 'subitems'])
})

const updateNoteSchema = z.object({
  note_id: z.number().int(),
  body: z.string(),
});

const createNoteSchema = z.object({
  title: z.string().min(3).max(255),
  note_type: z.enum(['freetext', 'subitems']),
  body: z.string().optional(),
  subitems: z.array(z.object({
    text: z.string(),
    is_checked: z.boolean()
  })).optional(),
  display_order: z.number().int()
});

const deleteNoteSchema = z.object({
  note_id: z.number().int()
});

const updateSubitemCheckboxSchema = z.object({
  is_checked: z.boolean()
});

const updateSubitemTextSchema = z.object({
  text: z.string()
});

const createSubitemSchema = z.object({
  note_id: z.number().int(),
  text: z.string()
});

const reorderNotesSchema = z.object({
  note_ids: z.array(z.number().int())
});

export const notesRoute = new Hono()
  .use('/*', authMiddleware)
  .get('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      await postgresClient.connect();
      
      // First get all notes
      const notesRes = await postgresClient.query(
        `SELECT note_id, title, body, note_type, display_order
        FROM public."Notes" 
        WHERE user_id = $1 
        ORDER BY display_order ASC`,
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
  .post('/', zValidator('json', createNoteSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { title, body, note_type, subitems, display_order } = await c.req.json();
      
      await postgresClient.connect();
      
      // Start transaction
      await postgresClient.query('BEGIN');
      
      // Insert the note first
      const noteRes = await postgresClient.query(
        `INSERT INTO public."Notes" (user_id, title, body, note_type, display_order) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING note_id`,
        [c.user!.user_id, title, body, note_type, display_order]
      );
      
      const noteId = noteRes.rows[0].note_id;
      
      // If it's a subitems note and subitems were provided, insert them
      if (note_type === 'subitems' && subitems && subitems.length > 0) {
        const subitemValues = subitems
          .map((_: any, i: number) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
          .join(', ');
        
        const subitemParams = [noteId];
        subitems.forEach((item: { text: string; is_checked: boolean; }) => {
          subitemParams.push(item.text, item.is_checked);
        });
        
        await postgresClient.query(
          `INSERT INTO public."Subitems" (note_id, text, is_checked)
          VALUES ${subitemValues}`,
          subitemParams
        );
      }
      
      // Commit transaction
      await postgresClient.query('COMMIT');
      
      return c.json({ success: true, note_id: noteId });
      
    } catch (err) {
      // Rollback in case of error
      await postgresClient.query('ROLLBACK');
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .delete('/', zValidator('json', deleteNoteSchema), async (c: AuthedContext) => {
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
      const { note_id, body } = await c.req.json();
      
      await postgresClient.connect();
      
      // First verify the note belongs to the user
      const noteExistsCheck = await postgresClient.query(
        `SELECT note_id FROM public."Notes" 
        WHERE note_id = $1 AND user_id = $2`,
        [note_id, c.user!.user_id]
      );
      
      if (noteExistsCheck.rows.length === 0) {
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      // Update the note body
      await postgresClient.query(
        `UPDATE public."Notes" 
        SET body = $1 
        WHERE note_id = $2`,
        [body, note_id]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  
  .post('/subitems', zValidator('json', createSubitemSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { note_id, text } = await c.req.json();
      
      await postgresClient.connect();
      
      // First verify the note belongs to the user
      const noteExistsCheck = await postgresClient.query(
        `SELECT note_id FROM public."Notes" 
        WHERE note_id = $1 AND user_id = $2`,
        [note_id, c.user!.user_id]
      );
      
      if (noteExistsCheck.rows.length === 0) {
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      // Create the new subitem
      const newSubitemRes = await postgresClient.query(
        `INSERT INTO public."Subitems" (note_id, text, is_checked)
        VALUES ($1, $2, false)
        RETURNING subitem_id`,
        [note_id, text]
      );
      
      return c.json({ 
        success: true, 
        subitem_id: newSubitemRes.rows[0].subitem_id 
      });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .patch('/subitems/checkbox/:subitem_id', zValidator('json', updateSubitemCheckboxSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const subitemId = Number(c.req.param('subitem_id'));
      const updateData = await c.req.json();
      
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
      await postgresClient.query(
        `UPDATE public."Subitems" 
          SET is_checked = $1 
          WHERE subitem_id = $2`,
        [updateData.is_checked, subitemId]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .patch('/subitems/text/:subitem_id', zValidator('json', updateSubitemTextSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const subitemId = Number(c.req.param('subitem_id'));
      const updateData = await c.req.json();
      
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
      await postgresClient.query(
        `UPDATE public."Subitems" 
          SET text = $1 
          WHERE subitem_id = $2`,
        [updateData.text, subitemId]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .delete('/subitems/:subitem_id', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const subitemId = Number(c.req.param('subitem_id'));
      
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
      
      // Delete the subitem
      await postgresClient.query(
        `DELETE FROM public."Subitems" 
         WHERE subitem_id = $1`,
        [subitemId]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .put('/reorder', zValidator('json', reorderNotesSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { note_ids } = await c.req.json();
      
      await postgresClient.connect();
      
      // Start transaction
      await postgresClient.query('BEGIN');
      
      // First verify all notes belong to the user
      const noteCountRes = await postgresClient.query(
        `SELECT COUNT(*) as count 
         FROM public."Notes" 
         WHERE note_id = ANY($1) AND user_id = $2`,
        [note_ids, c.user!.user_id]
      );
      
      if (Number(noteCountRes.rows[0].count) !== note_ids.length) {
        await postgresClient.query('ROLLBACK');
        return c.json({ success: false, error: 'One or more notes not found or unauthorized' }, 404);
      }
      
      // Update the display_order for each note
      for (let i = 0; i < note_ids.length; i++) {
        await postgresClient.query(
          `UPDATE public."Notes" 
           SET display_order = $1 
           WHERE note_id = $2 AND user_id = $3`,
          [i, note_ids[i], c.user!.user_id]
        );
      }
      
      await postgresClient.query('COMMIT');
      
      return c.json({ success: true });
      
    } catch (err) {
      await postgresClient.query('ROLLBACK');
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  });
  