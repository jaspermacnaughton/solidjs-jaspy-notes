import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { notesRoute } from './routes/notes';
import { serveStatic } from 'hono/bun'
import { authRoute } from './routes/auth';

const app = new Hono()

app.use("*", logger())

app.route("/api/notes", notesRoute);
app.route("/api/auth", authRoute);

app.get("*", serveStatic({ root: "./frontend/dist"}))
app.get("*", serveStatic({ path: "./frontend/dist/index.html"}))

export default app