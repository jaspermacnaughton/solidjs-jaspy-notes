import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { getPostgresClient } from '../utils/db';

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
.get("/", async (c) => {
  const postgresClient = getPostgresClient();
  
  try {
    await postgresClient.connect();
    const res = await postgresClient.query(`
      SELECT * FROM public."Notes"
      ORDER BY note_id ASC
    `);
    return c.json(res.rows)
    
  } catch (err) {
    return c.json({ success: false, error: 'Failed to fetch notes' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.post("/", zValidator("json", createNoteSchema), async (c) => {
  //const note = createNoteSchema.parse(data); // Could have done the zValidator manually
  const data = c.req.valid("json");
  
  const postgresClient = getPostgresClient();
  
  try {
    await postgresClient.connect();
    const res = await postgresClient.query(`
      INSERT INTO public."Notes" (title, body)
      VALUES ('${data.title}', '${data.body}')
      RETURNING note_id;
      `);
    return c.json({ success: true, note_id: res.rows[0]["note_id"]}); // only adding one row at a time so it's safe to just return the first
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.delete("/", zValidator("json", deleteNoteSchema), async (c) => {
  const data = c.req.valid("json");
  const note_id = data.note_id;
  
  const postgresClient = getPostgresClient();
  
  try {
    await postgresClient.connect();
    const res = await postgresClient.query(`
      DELETE FROM public."Notes"
      WHERE note_id = ${note_id};
      `);
    return c.json({ success: true });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }  
})
// .put