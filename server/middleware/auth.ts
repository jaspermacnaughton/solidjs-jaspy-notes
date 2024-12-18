import type { Context, Next } from "hono";
import { verify } from 'jsonwebtoken';
import { env } from "bun";

const JWT_SECRET = env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthedContext extends Context {
  user?: {
    user_id: number;
    username: string;
  }
}

interface JWTPayload {
  user_id: number;
  username: string;
}

export async function authMiddleware(c: AuthedContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verify(token, JWT_SECRET as string) as unknown as JWTPayload;
    c.user = decoded;
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
} 