# Architecture

## Monorepo Shape

Top-level repository `tfg/` currently contains multiple parts:

- `carfindr/`: Main web app (Next.js 15 + TypeScript + tRPC + Drizzle + NextAuth).
- `searchNotifier/`: Background service (Go) that checks saved searches and sends email alerts.
- `db/`: SQL bootstrap and CSV dictionaries used to seed brands/models.
- `PoC/`: Research and reverse-engineering scripts/data (Python and static assets).
- `docker-compose.yml`: Local infra for PostgreSQL and Redis.
- `prodCompose.yml`: Production-oriented compose definition.

## High-Level Runtime Flow

1. User logs into `carfindr` and creates a saved search.
2. Saved search rows are stored in PostgreSQL (`saved_search`).
3. `searchNotifier` periodically reads saved searches and queries external providers:
   - Wallapop
   - Milanuncios
   - Coches.net
4. New listings are de-duplicated using per-listing hashes and persisted in `searched_car_listings`.
5. If new listings exist, email notifications are sent via Resend.

## Shared Data Contract

Both `carfindr` and `searchNotifier` depend on shared DB semantics:

- Search filters (brand/model/year/price/km/transmission/text)
- Provider-specific pagination data (`next_page_data` JSONB)
- Saved search ownership (`user_id`)
- Seen-listing hash tracking (`saved_search_id + listing_hash` unique index)

## Important Operational Notes

- The repo includes nested git repositories (`carfindr/.git` and `searchNotifier/.git`) in addition to root `.git`.
- Some integration code has hardcoded scraping headers/cookies and should be treated as brittle.
- Environment variables and secrets are required for full runtime behavior; avoid documenting real values.
