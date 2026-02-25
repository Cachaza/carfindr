# Database and Data Model

## Infra

Local services are defined in root `docker-compose.yml`:

- PostgreSQL 17
- Redis 7

DB bootstrap SQL:

- `db/init-db/init.sql`

Seed CSV files:

- `db/csv-data/dictionaryCochesNetMilanunciosMarcas.csv`
- `db/csv-data/updated_dictionary.csv`

## Core Tables

Application-level schema is defined in:

- `carfindr/src/server/db/schema.ts`

Important tables:

- `user`, `account`, `session`, `verification_token` (NextAuth)
- `marcas`, `modelos` (cross-provider brand/model mapping)
- `saved_search` (user-defined search filters and pagination state)
- `searched_car_listings` (deduplication history for notifier)

## Cross-Service Contract

`searchNotifier` assumes these columns exist and are meaningful in `saved_search`:

- `brand_id`, `model_id`
- `year_from`, `year_to`
- `price_from`, `price_to`
- `km_from`, `km_to`
- `transmission`, `search_text`
- `brand_param`, `model_param`
- `next_page_data` (JSONB)

And in `searched_car_listings`:

- `saved_search_id`
- `listing_hash`
- `listing_id`

## Agent Rules for Schema Changes

When changing DB schema, update all relevant surfaces:

1. `carfindr/src/server/db/schema.ts`
2. Drizzle migration artifacts under `carfindr/drizzle/`
3. tRPC procedures and UI forms using affected fields
4. Go models/queries in `searchNotifier/internal/db` and `searchNotifier/internal/models`
5. Any bootstrap SQL or seed assumptions under `db/`
