import { Hono } from "hono";
import { getPostgresClient } from '../utils/db';
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sign } from "jsonwebtoken";
import { env } from "bun";

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const credentialsSchema = z.object({
  username: z.string().max(31),
  password: z.string()
})

const generateJWT = (user_id: number, username: string) => {
  return sign(
    { 
      user_id,
      username 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export const authRoute = new Hono()
.post("/register", zValidator("json", credentialsSchema), async (c) => {
  const postgresClient = getPostgresClient();
  
  try {
    const { username, password } = await c.req.json();
    
    await postgresClient.connect();
    
    const existingUser = await postgresClient.query(`
      SELECT username FROM public."Users" 
      WHERE username = '${username}'
    `);

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Username already exists' }, 400);
    }

    const res = await postgresClient.query(`
      INSERT INTO public."Users" (username, password)
      VALUES ('${username}', crypt('${password}', gen_salt('bf')))
      RETURNING user_id;
    `);

    return c.json({ 
      success: true,
      user_id: res.rows[0].user_id,
      token: generateJWT(res.rows[0].user_id, username)
    });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
})
.post("/login", zValidator("json", credentialsSchema), async (c) => {
  const postgresClient = getPostgresClient();
  
  try {
    const { username, password } = await c.req.json();
    
    await postgresClient.connect();
    
    const user = await postgresClient.query(`
      SELECT user_id, username, password 
      FROM public."Users" 
      WHERE username = '${username}' 
      AND password = crypt('${password}', password)
    `);

    if (user.rows.length === 0) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    return c.json({ 
      success: true,
      user_id: user.rows[0].user_id,
      token: generateJWT(user.rows[0].user_id, username)
    });
    
  } catch (err) {
    return c.json({ success: false, error: 'Internal Server Error' }, 500);
    
  } finally {
    await postgresClient.end();
  }
});