# Search Notifier Service (`searchNotifier/`)

## Purpose

Runs as a background worker that periodically processes saved searches and notifies users about newly discovered car listings.

## Entry Point and Flow

- Entry point: `searchNotifier/main.go`
- Core loop: `internal/scheduler/scheduler.go`

Startup sequence:

1. Load env (`godotenv`).
2. Connect to DB using `DATABASE_URL`.
3. Build provider clients:
   - `internal/clients/wallapop/client.go`
   - `internal/clients/milanuncios/client.go`
   - `internal/clients/cochesnet/client.go`
4. Load initial saved searches.
5. Start scheduler ticker.

## Scheduler Behavior

- Processes saved searches in round-robin order.
- Refreshes in-memory saved-search list periodically (every 5 minutes in current code).
- Uses provider-specific pagination tokens from `saved_search.next_page_data`.
- Uses hash-based deduplication via `internal/hasher/hasher.go`.
- Persists newly seen listings into `searched_car_listings`.
- Sends email summary per processed search when new listings were found.

## Email Notification Layer

- `internal/notifier/email.go`
- Provider: Resend
- Contract: `SendNotificationEmail(ctx, user, savedSearch, newCarsCount)`

## Environment and Config

Important env vars:

- `DATABASE_URL`
- `SCHEDULER_INTERVAL_SECONDS`

Operational warning:

- Current scheduler initialization includes hardcoded notifier initialization values in code. This should be treated as technical debt and moved to environment variables.
