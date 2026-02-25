# Carfindr App (`carfindr/`)

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- tRPC (API layer)
- Drizzle ORM (PostgreSQL)
- NextAuth (Google + Discord providers)
- Tailwind CSS + Radix UI components

## Main Directory Layout

- `src/app/`: Routes, server actions, API route handlers.
- `src/components/`: UI components and platform result cards.
- `src/server/api/`: tRPC routers and shared procedure utilities.
- `src/server/auth/`: NextAuth config and auth wiring.
- `src/server/db/`: Drizzle schema and DB client setup.
- `src/trpc/`: Client/server tRPC integration helpers.

## Key Functional Areas

### 1) Search Integrations (Server Actions)

- `src/app/actions/wallapop.ts`
- `src/app/actions/milanuncios.ts`
- `src/app/actions/cochesNet.ts`

These actions call provider APIs and normalize enough data for UI display. Pagination handling differs by provider.

### 2) Saved Searches via tRPC

- `src/server/api/routers/savedSearch.ts`

Provides protected procedures to:

- Save a search
- List current user searches
- Delete owned search

### 3) Auth and User Lifecycle

- `src/server/auth/config.ts`

NextAuth is configured with Drizzle adapter. A welcome email is sent on user creation when Resend is configured.

### 4) Environment Validation

- `src/env.js`

Runtime env schema is validated with `@t3-oss/env-nextjs` and Zod.

## Known Codebase Realities (for agents)

- There are legacy or duplicate files (for example `* copy.tsx`) in `src/components/`; verify before editing.
- External provider requests use strict headers and in some cases static values; behavior may break when providers change.
- Keep schema changes synchronized with both app logic and notifier logic.
