#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is required (postgresql-client)."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is required. Install it with corepack: corepack enable pnpm"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set."
  echo "Example: export DATABASE_URL='postgresql://user:pass@host:5432/carfindr?sslmode=disable'"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/2] Applying schema migrations with Drizzle..."
(
  cd "$ROOT_DIR/carfindr"
  SKIP_ENV_VALIDATION=1 DATABASE_URL="$DATABASE_URL" pnpm db:push
)

echo "[2/2] Seeding marcas/modelos from CSV files..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
TRUNCATE TABLE modelos, marcas RESTART IDENTITY CASCADE;
\copy marcas(label, cochesnetid, milanunciosid, wallapopid, cochescomid) FROM '$ROOT_DIR/db/csv-data/dictionaryCochesNetMilanunciosMarcas.csv' WITH (FORMAT csv, HEADER true, NULL '');
\copy modelos(cochesnetmarcaid, cochesnetmodeloid, milanunciosmarcaid, milanunciosmodeloid, wallapopmarcaid, wallapopmodeloid, cochescommarcaid, cochescommodeloid) FROM '$ROOT_DIR/db/csv-data/updated_dictionary.csv' WITH (FORMAT csv, HEADER true, NULL '');
CREATE INDEX IF NOT EXISTS idx_modelos_cochesNetModeloId ON modelos(cochesnetmodeloid);
SQL

echo "Done: migrations applied and CSV seed loaded."
