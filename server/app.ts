import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun'
import { authRoute } from './routes/auth';
import { notesRoute } from './routes/notes';
import { subitemsRoute } from './routes/subitems';

const app = new Hono()

app.use("*", logger())

app.route("/api/auth", authRoute);
app.route("/api/notes", notesRoute);
app.route("/api/notes/subitems", subitemsRoute);

app.get("*", serveStatic({ root: "./frontend/dist"}))
app.get("*", serveStatic({ path: "./frontend/dist/index.html"}))

export default app