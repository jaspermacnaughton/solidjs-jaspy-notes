import { Client } from 'pg';
import { env } from 'bun';

export function getPostgresClient() {
  return new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: Number(env.DB_PORT),
  });
} 