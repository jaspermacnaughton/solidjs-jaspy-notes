import app from './app'

Bun.serve({
  fetch: app.fetch // delegate to hono
});

console.log("Server is running")