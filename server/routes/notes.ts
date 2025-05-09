import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'

import { getPostgresClient } from '../utils/db';
import { authMiddleware } from '../middleware/auth';
import type { AuthedContext } from '../middleware/auth';

const createNoteSchema = z.object({
  title: z.string().min(3).max(255),
  noteType: z.enum(['freetext', 'subitems']),
  body: z.string().optional(),
  subitems: z.array(z.object({
    text: z.string(),
    isChecked: z.boolean()
  })).optional(),
  displayOrder: z.number().int()
});

const updateFreetextNoteSchema = z.object({
  noteId: z.number().int(),
  body: z.string(),
});

const updateNoteTitleSchema = z.object({
  noteId: z.number().int(),
  title: z.string().min(3).max(255),
});

const deleteNoteSchema = z.object({
  noteId: z.number().int()
});

const reorderNotesSchema = z.object({
  noteIds: z.array(z.number().int())
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
        noteId: note.note_id,
        title: note.title,
        body: note.body,
        noteType: note.note_type,
        displayOrder: note.display_order,
        subitems: subitemsRes.rows.filter(subitem => subitem.note_id === note.note_id).map(subitem => ({
          subitemId: subitem.subitem_id,
          noteId: subitem.note_id,
          text: subitem.text,
          isChecked: subitem.is_checked
        }))
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
      const { title, body, noteType, subitems, displayOrder } = await c.req.json();
      
      await postgresClient.connect();
      
      // Start transaction
      await postgresClient.query('BEGIN');
      
      // Insert the note first
      const noteRes = await postgresClient.query(
        `INSERT INTO public."Notes" (user_id, title, body, note_type, display_order) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING note_id`,
        [c.user!.user_id, title, body, noteType, displayOrder]
      );
      
      const noteId = noteRes.rows[0].note_id;
      
      // If it's a subitems note and subitems were provided, insert them
      if (noteType === 'subitems' && subitems && subitems.length > 0) {
        const subitemValues = subitems
          .map((_: any, i: number) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
          .join(', ');
        
        const subitemParams = [noteId];
        subitems.forEach((item: { text: string; isChecked: boolean; }) => {
          subitemParams.push(item.text, item.isChecked);
        });
        
        await postgresClient.query(
          `INSERT INTO public."Subitems" (note_id, text, is_checked)
          VALUES ${subitemValues}`,
          subitemParams
        );
      }
      
      // Commit transaction
      await postgresClient.query('COMMIT');
      
      return c.json({ success: true, noteId: noteId });
      
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
      const { noteId } = await c.req.json();
      
      await postgresClient.connect();
      
      const res = await postgresClient.query(
        `DELETE FROM public."Notes"
        WHERE note_id = $1 AND user_id = $2
        RETURNING note_id`,
        [noteId, c.user!.user_id]
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
  .put('/title', zValidator('json', updateNoteTitleSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { noteId, title } = await c.req.json();
      
      await postgresClient.connect();
      
      // First verify the note belongs to the user
      const noteExistsCheck = await postgresClient.query(
        `SELECT note_id FROM public."Notes" 
        WHERE note_id = $1 AND user_id = $2`,
        [noteId, c.user!.user_id]
      );
      
      if (noteExistsCheck.rows.length === 0) {
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      // Update the note title
      await postgresClient.query(
        `UPDATE public."Notes" 
        SET title = $1 
        WHERE note_id = $2`,
        [title, noteId]
      );
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .put('/body', zValidator('json', updateFreetextNoteSchema), async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { noteId, body } = await c.req.json();
      
      await postgresClient.connect();
      
      // First verify the note belongs to the user
      const noteExistsCheck = await postgresClient.query(
        `SELECT note_id FROM public."Notes" 
        WHERE note_id = $1 AND user_id = $2`,
        [noteId, c.user!.user_id]
      );
      
      if (noteExistsCheck.rows.length === 0) {
        return c.json({ success: false, error: 'Note not found or unauthorized' }, 404);
      }
      
      // Update the note body
      await postgresClient.query(
        `UPDATE public."Notes" 
        SET body = $1 
        WHERE note_id = $2`,
        [body, noteId]
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
      const { noteIds } = await c.req.json();
      
      await postgresClient.connect();
      
      // Start transaction
      await postgresClient.query('BEGIN');
      
      // First verify all notes belong to the user
      const noteCountRes = await postgresClient.query(
        `SELECT COUNT(*) as count 
         FROM public."Notes" 
         WHERE note_id = ANY($1) AND user_id = $2`,
        [noteIds, c.user!.user_id]
      );
      
      if (Number(noteCountRes.rows[0].count) !== noteIds.length) {
        await postgresClient.query('ROLLBACK');
        return c.json({ success: false, error: 'One or more notes not found or unauthorized' }, 404);
      }
      
      // Update the display_order for each note
      await postgresClient.query(
        `UPDATE public."Notes"
        SET display_order = data.display_order
        FROM (
          SELECT note_id, index - 1 AS display_order
          FROM unnest($1::integer[]) WITH ORDINALITY AS t(note_id, index)
        ) AS data
        WHERE public."Notes".note_id = data.note_id;`,
        [noteIds]
      );
    
      await postgresClient.query('COMMIT');
      
      return c.json({ success: true });
      
    } catch (err) {
      await postgresClient.query('ROLLBACK');
      return c.json({ success: false, error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  });
  