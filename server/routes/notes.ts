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
      
      const res = await postgresClient.query(`
        SELECT note_id, title, body 
        FROM public."Notes"
        WHERE user_id = ${c.user!.user_id}
        ORDER BY note_id DESC
      `);
      
      return c.json(res.rows);
      
    } catch (err) {
      return c.json({ error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .post('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { title, body } = await c.req.json();
      
      await postgresClient.connect();
      
      const res = await postgresClient.query(`
        INSERT INTO public."Notes" (user_id, title, body)
        VALUES (${c.user!.user_id}, '${title}', '${body}')
        RETURNING note_id
      `);
      
      return c.json({ note_id: res.rows[0].note_id });
      
    } catch (err) {
      return c.json({ error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  })
  .delete('/', async (c: AuthedContext) => {
    const postgresClient = getPostgresClient();
    
    try {
      const { note_id } = await c.req.json();
      
      await postgresClient.connect();
      
      const res = await postgresClient.query(`
        DELETE FROM public."Notes"
        WHERE note_id = ${note_id} AND user_id = ${c.user!.user_id}
        RETURNING note_id
      `);
      
      if (res.rowCount === 0) {
        return c.json({ error: 'Note not found or unauthorized' }, 404);
      }
      
      return c.json({ success: true });
      
    } catch (err) {
      return c.json({ error: 'Internal Server Error' }, 500);
      
    } finally {
      await postgresClient.end();
    }
  });
// .put