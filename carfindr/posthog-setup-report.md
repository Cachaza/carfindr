<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into MotorFindr (Next.js 16 App Router). The following changes were made:

- **`instrumentation-client.ts`** (new): Initialises the PostHog JS SDK client-side for all pages, including automatic exception capture and a reverse proxy route (`/ingest`).
- **`src/lib/posthog-server.ts`** (new): Server-side PostHog Node SDK helper used for future server-side tracking.
- **`next.config.js`**: Added `/ingest` reverse proxy rewrites to route PostHog requests through the app, reducing tracking-blocker interference.
- **`src/env.js`**: Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to the T3 env schema.
- **`.env.local`**: Populated PostHog key and host environment variables.

Event tracking was instrumented across 5 client-side files:

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully creates a new account (email or social) | `src/components/login-form.tsx` |
| `user_logged_in` | User successfully signs in (email, Google, or Discord) | `src/components/login-form.tsx` |
| `search_submitted` | User submits a search from the home page search card | `src/components/searchCard.tsx` |
| `search_filters_applied` | User applies updated filters from the search results sidebar | `src/components/sidebar.tsx` |
| `search_saved` | User saves a search query | `src/components/sidebar.tsx` |
| `saved_search_deleted` | User deletes a saved search from their profile | `src/app/user/page.tsx` |
| `saved_search_clicked` | User re-runs a saved search (profile page or recent searches card) | `src/app/user/page.tsx`, `src/components/RecentSearchesCard.tsx` |
| `account_deleted` | User confirms deletion of their account | `src/app/user/page.tsx` |
| `data_report_requested` | User requests their personal data report | `src/app/user/page.tsx` |

Error tracking via `posthog.captureException` was added to all auth error paths, save/delete mutation failures, and the account deletion flow.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/135811/dashboard/552908
- **Sign Ups & Logins over time**: https://eu.posthog.com/project/135811/insights/u05poqEj
- **Search to Save conversion funnel**: https://eu.posthog.com/project/135811/insights/UYmfVd5T
- **Search engagement: Searches, Saves, and Replays**: https://eu.posthog.com/project/135811/insights/Vdpzd2iQ
- **New user activation funnel**: https://eu.posthog.com/project/135811/insights/IExUIXOn
- **Churn signals: Account & Search deletions**: https://eu.posthog.com/project/135811/insights/cXCOWro8

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
