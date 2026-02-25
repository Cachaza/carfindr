# Dev Setup and Commands

## Prerequisites

- Node.js 18+
- pnpm
- Go 1.24+
- Docker + Docker Compose

## Start Local Infra (root)

```bash
docker-compose up -d db redis
```

## Carfindr App (`carfindr/`)

Install and run:

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm check
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:push
pnpm db:studio
```

## Search Notifier (`searchNotifier/`)

Run locally:

```bash
go mod tidy
go run main.go
```

## Environment Files

Common locations:

- Root: `.env` (compose/database context)
- App: `carfindr/.env`, `carfindr/.env.example`
- Notifier: `searchNotifier/.env`

Do not commit real secrets. Keep docs and examples using placeholders.

## Practical Agent Workflow

1. Start DB/Redis.
2. Validate app env variables.
3. Run app checks before/after edits.
4. If changing shared search fields, verify both TS app and Go notifier compile paths.
