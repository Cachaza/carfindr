# TODO

Execution plan and backlog for repo-wide missing work.

## Phase 1 - Dependency Upgrade (`carfindr`)

### 1.1 Baseline and target versions

- [x] Capture current versions and define target upgrade set (`carfindr/package.json`).
- [x] Decide upgrade order (core first: Next.js/React, then auth/trpc/drizzle/tooling).

Kickoff notes (2026-02-21):

- Baseline was collected via `pnpm outdated` in `carfindr/`.
- Proposed upgrade order:
  1) Next.js + React + eslint-config-next
  2) TypeScript + types + eslint toolchain
  3) tRPC stack
  4) Drizzle stack
  5) UI/runtime libs
  6) Tailwind v4 migration as a dedicated step

Target set for first implementation pass (balanced, lower-risk):

- `next`: `16.1.x`
- `react`, `react-dom`: `19.2.x`
- `eslint-config-next`: `16.1.x`
- `typescript`: `5.9.x`
- `@types/react`, `@types/react-dom`: `19.x`
- `@trpc/client`, `@trpc/react-query`, `@trpc/server`: `11.10.x`
- `drizzle-orm`: `0.45.x`
- `drizzle-kit`: `0.31.x`
- `@auth/drizzle-adapter`: `1.11.x`
- `next-auth`: `5.0.0-beta.30` (keep v5 API compatibility)

Deferred to a separate migration step:

- `tailwindcss@4.x` (requires config/style migration and plugin review)
- `zod@4.x` (breaking API surface; do after core upgrade is green)
- `redis@5.x` and `resend@6.x` (verify API compatibility in app/notifier)

### 1.2 Upgrade implementation

- [x] Update dependencies and lockfile (`carfindr/package.json`, `carfindr/pnpm-lock.yaml`).
- [x] Update configs if required by new versions (`carfindr/next.config.js`, `carfindr/tsconfig.json`, lint/prettier configs).

### 1.3 Breakage fixes and verification

- [x] Fix compile/type issues introduced by upgrades (all affected files under `carfindr/src/`).
- [x] Validate auth and session flow (`carfindr/src/server/auth/config.ts`, `carfindr/src/app/api/auth/[...nextauth]/route.ts`).
- [x] Validate tRPC/API behavior (`carfindr/src/server/api/root.ts`, `carfindr/src/server/api/routers/*`).
- [x] Run checks and record outcome: `pnpm lint`, `pnpm typecheck`, `pnpm build`.

Verification snapshot (2026-02-21):

- `pnpm lint`: passes with warnings (no errors).
- `pnpm typecheck`: passes.
- `pnpm build`: passes after starting Redis (`docker-compose up -d redis`).

## Phase 2 - Wallapop API Migration (App + Notifier)

### 2.1 App integration update

- [ ] Re-validate Wallapop request contract and pagination behavior.
- [ ] Update app action implementation (`carfindr/src/app/actions/wallapop.ts`).
- [ ] Verify search page wiring still works (`carfindr/src/app/search/Search.tsx`, related components).

### 2.2 Notifier integration update

- [ ] Update notifier Wallapop client to new API contract (`searchNotifier/internal/clients/wallapop/client.go`).
- [ ] Verify scheduler pagination state handling remains correct (`searchNotifier/internal/scheduler/scheduler.go`).

### 2.3 Validation and docs

- [ ] Validate end-to-end flow with saved searches and dedup insertion.
- [ ] Document updated Wallapop assumptions and pitfalls (`docs/search-notifier.md`, `docs/carfindr-app.md`).

## Phase 3 - UI Refresh (`carfindr`)

### 3.1 Audit

- [ ] Audit UX consistency on `/`, `/search`, `/user`, `/login`.
- [ ] Capture issues and desired style direction before code changes.

### 3.2 Implementation

- [ ] Apply updated design pass to key shared components (`carfindr/src/components/*`, `carfindr/src/styles/globals.css`).
- [ ] Ensure mobile and desktop behavior are both solid.

### 3.3 Cleanup

- [ ] Remove/resolve legacy duplicate files only after usage verification (for example `carfindr/src/components/* copy.tsx`).

## Phase 4 - Reliability and Ops Hardening

- [ ] Move hardcoded notifier/email config to env vars (`searchNotifier/internal/scheduler/scheduler.go`, `searchNotifier/internal/notifier/email.go`, `searchNotifier/main.go`).
- [ ] Add practical health-check runbook for local validation (`docs/dev-setup-and-commands.md`).
- [ ] Keep docs in sync after each schema/provider/search-field change (`docs/*`, `AGENTS.md`).

## Nice to Have

- [ ] Add smoke tests for saved-search creation and notifier processing loop.
- [ ] Add provider troubleshooting docs (rate limits, required headers, pagination pitfalls).
- [ ] Add release checklist for upgrade waves.

## Working Rules

- Keep items actionable and file-scoped when possible.
- When completing an item, mark it done and add a short note to the relevant docs file.
