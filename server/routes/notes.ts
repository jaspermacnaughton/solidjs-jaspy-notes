import { Hono } from "hono"
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { Client } from 'pg';
import { env } from "bun";

function getPosgresClient() {
  return new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT),
  });
}

const noteSchema = z.object({
  id: z.number().int().positive().min(1),
  title: z.string().min(3).max(100),
  body: z.string()
})

const createNoteSchema = noteSchema.omit({
  id: true
});

const deleteNoteSchema = z.object({
  id: z.number().min(0).int()
});

export const notesRoute = new Hono()
.get("/", async (c) => {
  const postgresClient = getPosgresClient();
  
  try {
    
    await postgresClient.connect();
    // Test query
    // const res = await client.query('SELECT version();');
    // console.log("PostgreSQL Version:", res.rows[0].version);
    const res = await postgresClient.query(`
      SELECT * FROM public."Notes"
      ORDER BY id ASC
      `);
    return c.json(res.rows)
    
  } catch (err) {
    console.error('Error emitted:', err);
    return c.json({"error": 'Internal Server Error'}, 500);
    
  } finally {
    await postgresClient.end();
    
  }
})
.post("/", zValidator("json", createNoteSchema), async (c) => {
  //const note = createNoteSchema.parse(data); // Could have done the zValidator manually
  const data = c.req.valid("json");
  
  const postgresClient = getPosgresClient();
  
  try {
    await postgresClient.connect();
    const res = await postgresClient.query(`
      INSERT INTO public."Notes" (title, body)
      VALUES ('${data.body}', '${data.body}')
      RETURNING id;
      `);
    return c.json({"id": res.rows[0]["id"]}); // only adding one row at a time so it's safe to just return the first
    
  } catch (err) {
    console.error('Error emitted:', err);
    return c.json({"error": 'Internal Server Error'}, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.delete("/", zValidator("json", deleteNoteSchema), async (c) => {
  const data = c.req.valid("json");
  const id = data.id;
  
  const postgresClient = getPosgresClient();
  
  try {
    await postgresClient.connect();
    const res = await postgresClient.query(`
      DELETE FROM public."Notes"
      WHERE id = ${id};
      `);
    return new Response();
    
  } catch (err) {
    console.error('Error emitted:', err);
    return c.json({"error": 'Internal Server Error'}, 500);
    
  } finally {
    await postgresClient.end();
  }  
})
// .put