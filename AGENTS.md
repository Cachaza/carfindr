# AGENTS.md

This file defines onboarding context for AI coding agents working in this repository.

## Project Overview

CarFindr is a multi-part project for used-car search aggregation:

- `carfindr/`: Next.js web app where users search and save alerts.
- `searchNotifier/`: Go worker that executes saved searches and sends notifications.
- `db/`: SQL bootstrap + CSV dictionaries for brand/model mapping.
- `PoC/`: Research scripts and provider API exploration assets.

See `docs/README.md` for focused docs by area.

## Source of Truth

- Web app schema and auth: `carfindr/src/server/db/schema.ts`, `carfindr/src/server/auth/config.ts`
- Web app API layer: `carfindr/src/server/api/`
- Provider actions in app: `carfindr/src/app/actions/`
- Notifier orchestration: `searchNotifier/main.go`, `searchNotifier/internal/scheduler/scheduler.go`
- DB bootstrap data: `db/init-db/init.sql`, `db/csv-data/`

## Local Runbook

From repository root:

```bash
docker-compose up -d db redis
```

Web app:

```bash
cd carfindr
pnpm install
pnpm dev
```

Notifier:

```bash
cd searchNotifier
go mod tidy
go run main.go
```

## Agent Guardrails

1. Do not commit or expose secrets from `.env` files.
2. Treat provider integrations as fragile; preserve request semantics unless intentionally refactoring.
3. Keep DB contract compatibility between TypeScript app and Go notifier.
4. When changing saved-search fields, update both services and docs.
5. Prefer small, focused edits and keep docs in sync with structural changes.

## Known Repository Realities

- Nested git repositories exist in `carfindr/` and `searchNotifier/`.
- Some legacy/duplicate files are present (for example `* copy.tsx`), so verify target files before editing.
- `searchNotifier/README.md` is currently empty; rely on code and docs in `docs/`.
