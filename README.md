# Jaspy Notes

Basic note CRUD app to learn SolidJS, Bun/Hono and Postgres. Hosted at https://jaspynotes.xyz

## Run in dev mode

Run these in two terminals

**Backend**
```bash
bun run dev
```

**Frontend**
```bash
cd frontend
bun run dev
```

Go to http://localhost:5173/


## Run a production build

**Build the frontend**
```bash
cd frontend
bun install
bun run build
cd ..
```

**Serve**
```bash
bun server/index.ts
```
