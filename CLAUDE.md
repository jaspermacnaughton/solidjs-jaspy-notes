# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jaspy Notes is a full-stack note-taking application built as a learning project for SolidJS, Bun/Hono, and PostgreSQL. The app supports two note types: freetext notes and notes with subitems (checklist-style). Hosted at https://jaspynotes.xyz.

## Tech Stack

- **Runtime**: Bun (use `bun` or `bunx` commands, not Node.js)
- **Frontend**: SolidJS with TypeScript, Vite, TailwindCSS
- **Backend**: Hono framework on Bun runtime
- **Database**: PostgreSQL
- **Authentication**: JWT tokens stored in localStorage

## Development Commands

### Root Level (Backend)
```bash
bun start          # Start production server
bun dev            # Start dev server with watch mode
```

### Frontend (run from /frontend directory)
```bash
bun dev            # Start Vite dev server (proxies /api to localhost:3000)
bun run build      # Build for production
```

## Architecture

### Monorepo Structure
The project has a split frontend/backend structure:
- Root level contains backend code (Hono server)
- `/frontend` directory contains SolidJS frontend (separate package.json)

### Backend (Hono/Bun)
- **Entry**: `server/index.ts` uses `Bun.serve()` to delegate to Hono app
- **App**: `server/app.ts` defines routes and serves static frontend from `frontend/dist`
- **Routes**: Organized by domain (`auth.ts`, `notes.ts`, `subitems.ts`)
- **Auth**: JWT-based middleware in `server/middleware/auth.ts` validates Bearer tokens
- **Database**: PostgreSQL client utility in `server/utils/db.ts` reads from environment variables

### Frontend (SolidJS)
- **Router**: Uses `@solidjs/router` with protected routes
- **State Management**: Three context providers manage global state:
  - `AuthContext`: JWT token, user info, login/register/logout
  - `NotesContext`: All CRUD operations for notes and subitems (uses `createResource`)
  - `ToastContext`: Toast notifications for user feedback
- **Context Pattern**: All contexts require their respective hooks (`useAuth()`, `useNotes()`, `useToast()`)
- **App Structure**: `App.tsx` wraps everything in ToastContext > AuthContext > Router

### Data Model
Notes have two types (`noteType: 'freetext' | 'subitems'`):
- **Freetext**: Simple title + body
- **Subitems**: Title + array of checkable items

Notes maintain a `displayOrder` field for drag-and-drop reordering. See `frontend/src/types/notes.ts` for full schema.

### API Pattern
- Frontend makes authenticated requests with `Authorization: Bearer ${token}` header
- `handleApiResponse()` utility handles 401s by calling `auth.logout()`
- NotesContext uses optimistic updates via `mutateNotes()` for instant UI feedback

### Development Proxy
Vite dev server proxies `/api/*` requests to `http://localhost:3000` (backend must run separately)

## Coding Conventions

- **Frontend naming**: Use camelCase for all variables, functions, and properties
- **Package manager**: Always use `bun` or `bunx`, never `npm` or `node`
- **TypeScript**: Strict mode enabled, but unused locals/parameters checks disabled

## Environment Variables
Backend requires these env vars (typically in `.env`):
- `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`
- `JWT_SECRET`
