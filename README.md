# E-Commerce Marketing OS — Phase A

Early implementation, **not production-ready**. Implemented: workspace registration, password login, database-backed sessions, tenant-scoped draft creation/listing/editing/deletion, a dashboard showing draft counts, and a token encryption primitive. The social, advertising, AI, automation, scheduling worker, reports, billing, password recovery, email verification, admin, and team-management features are not implemented. No external data is simulated. Do not deploy with real customer data yet: production hardening, infrastructure, email verification, comprehensive abuse controls, backups, monitoring, and a security review remain necessary.

## Requirements

Node.js 24 and a PostgreSQL database. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (keep credentials out of source control). Apply the migration with `DATABASE_URL=... npm run migrate`, then start with `npm run dev`. Visit `http://localhost:3000`. Run `npm test` for unit and database integration tests; these use an isolated PGlite PostgreSQL engine, not a live production database. `npm run build` checks the application build. For browser integration tests, install a Playwright Chromium browser with `npx playwright install chromium`, then run `npm run test:e2e`; alternatively set `CHROMIUM_PATH` to an installed Chromium executable. The test creates a temporary in-memory database and starts a local app server.

## Files

- `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`: configuration at repository root.
- `migrations/0001_initial.sql`: PostgreSQL schema.
- `scripts/migrate.mjs`, `scripts/test-e2e.mjs`: migration and isolated end-to-end test runners.
- `src/db/schema.ts`, `src/db/client.ts`, `src/db/store.ts`: Drizzle schema, PostgreSQL connection, accounts and tenant-scoped drafts.
- `src/app/actions.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/shell.tsx`, `src/app/styles.css`: app shell, styles, and server actions.
- `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/drafts/page.tsx`: application routes.
- `src/domain/editorial.ts`, `src/security/token-vault.ts`: editorial state and encryption primitives, not yet wired to publishing or OAuth.
- `tests/editorial.test.mjs`, `tests/token-vault.test.mjs`, `tests/store.test.mjs`, `tests/e2e.mjs`: tests.
