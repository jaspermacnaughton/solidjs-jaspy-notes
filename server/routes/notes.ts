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

const createNoteSchema = noteSchema.omit({
  note_id: true
});

const deleteNoteSchema = z.object({
  note_id: z.number().int()
});

export const notesRoute = new Hono()
  .use('/*', authMiddleware)
  .get('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      await postgresClient.connect();
      
      const res = await postgresClient.query(
        `SELECT note_id, title, body 
        FROM public."Notes" 
        WHERE user_id = $1 
        ORDER BY note_id ASC`,
        [c.user!.user_id]
      );
      
      return c.json({ success: true, notes: res.rows });
      
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
.put('/', async (c: AuthedContext) => {
  const postgresClient = getPostgresClient();
  
  try {
    const { note_id, body } = await c.req.json();
    const userId = c.user!.user_id;
    
    await postgresClient.connect();
    
    const res = await postgresClient.query(
      `UPDATE public."Notes"
      SET body = $1
      WHERE note_id = $2 AND user_id = $3`,
      [body, note_id, userId]
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
});