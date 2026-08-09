# Implementation Plan: Printer Maintenance Tracker

## Repository Assessment

Current repository state is a minimal TypeScript scaffold only:

- `package.json` with a single `build: tsc` script
- `src/index.ts` with a placeholder `console.log`
- no frontend, backend, database resources, deployment config, tests, or documentation

This means the work is effectively a greenfield implementation, but the existing TypeScript baseline can be replaced cleanly without migration concerns.

## Overview

Build a single-service React + Vite + Fastify + MySQL Progressive Web App optimized for iPhone maintenance logging. The deployed artifact should be one DigitalOcean App Platform web service that serves both the compiled React frontend and the Fastify REST API, with DigitalOcean Managed MySQL as the only external dependency.

## Architecture Decisions

- **Single Node service**: Fastify serves `/api/*`, `/health`, and compiled frontend assets to keep DigitalOcean deployment simple.
- **Separated frontend/backend folders**: keeps React/Vite and Fastify concerns isolated while preserving one repository and one deployment unit.
- **MySQL schema-first design**: `resources/schema.sql` becomes the source of truth for tables, indexes, constraints, and seed jobs.
- **REST + TanStack Query**: use conventional REST endpoints and query invalidation instead of custom global caching.
- **Connectivity required for writes**: initial release blocks offline submissions instead of implementing a partially reliable mutation queue.
- **Mobile-first UI**: build the layout for narrow iPhone screens first, with bottom pill navigation and safe-area spacing baked into the shell.

## Dependency Graph

`schema.sql`
-> database config + connection layer
-> backend models/types + validation
-> repositories + services
-> Fastify routes
-> frontend API client
-> TanStack Query hooks
-> Maintenance + History pages
-> PWA/static serving + deployment docs

## Task List

### Phase 1: Foundation

## Task 1: Create project foundation

**Description:** Replace the placeholder TypeScript scaffold with a full repository structure for `frontend/`, `backend/`, `resources/`, and `.do/`. Add root scripts for install, dev, build, test, and production start. Configure TypeScript, shared package management, and environment loading for a single-service deployment model.

**Acceptance criteria:**
- [ ] Repository contains separate `frontend` and `backend` applications with root-level orchestration scripts.
- [ ] Root scripts support local development, build, and test flows without requiring manual path changes.
- [ ] `.env.example` documents `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, and `PORT`.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `npm run dev` instructions map cleanly to one frontend and one backend workflow.

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `.env.example`
- `frontend/package.json`
- `backend/package.json`
- `backend/tsconfig.json`
- `frontend/tsconfig.json`

**Estimated scope:** Medium

## Task 2: Define database schema and seed jobs

**Description:** Create the MySQL initialization script with tables, constraints, indexes, UTC-friendly timestamps, and the predefined maintenance jobs. Design the schema so it supports the current single-printer use case while leaving room for future expansion.

**Acceptance criteria:**
- [ ] `resources/schema.sql` creates `maintenance_jobs` and `maintenance_records` with appropriate primary keys, foreign keys, and constraints.
- [ ] `maintenance_records.category` is constrained to `ROUTINE` or `ERROR`.
- [ ] Schema seeds the initial maintenance jobs list and adds indexes for history queries.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: apply `resources/schema.sql` to a fresh MySQL database and confirm both tables and seed rows exist.

**Dependencies:** Task 1

**Files likely touched:**
- `resources/schema.sql`
- `README.md`

**Estimated scope:** Small

### Checkpoint: Foundation

- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Fresh MySQL initialization works from `resources/schema.sql`

### Phase 2: Backend Core

## Task 3: Add backend configuration, types, and database access

**Description:** Build the backend foundation: environment parsing, MySQL connection/pool setup, shared domain types, and error-response helpers. This task establishes the base required for repository and route implementation.

**Acceptance criteria:**
- [ ] Backend reads either discrete DB variables or `DATABASE_URL`.
- [ ] Database connection layer is isolated under `backend/src/database`.
- [ ] Shared backend types model jobs, records, create-record input, and API errors.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: backend can start locally with environment variables and respond on configured `PORT`.

**Dependencies:** Task 2

**Files likely touched:**
- `backend/src/config/env.ts`
- `backend/src/database/mysql.ts`
- `backend/src/models/maintenance.ts`
- `backend/src/types/api.ts`
- `backend/src/server.ts`

**Estimated scope:** Medium

## Task 4: Implement validation, repositories, and services

**Description:** Add server-side request validation and data-access/business-logic layers for loading jobs, reading history newest-first, validating maintenance job existence, and creating records safely.

**Acceptance criteria:**
- [ ] Create-record validation rejects invalid printer hours, categories, and malformed payloads with `400`.
- [ ] Missing maintenance jobs are surfaced as `404`.
- [ ] Service layer returns newest-first maintenance history including joined job names.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: repository/service tests cover valid create, invalid create, and newest-first history ordering.

**Dependencies:** Task 3

**Files likely touched:**
- `backend/src/validation/maintenance.ts`
- `backend/src/repositories/maintenance-jobs-repository.ts`
- `backend/src/repositories/maintenance-records-repository.ts`
- `backend/src/services/maintenance-service.ts`
- `backend/src/services/errors.ts`

**Estimated scope:** Medium

## Task 5: Implement Fastify routes and health endpoint

**Description:** Expose the required REST interface with consistent JSON responses and proper status codes. Keep HTTP concerns in routes and delegate business rules to services.

**Acceptance criteria:**
- [ ] `GET /api/maintenance/jobs` returns active jobs with `200`.
- [ ] `GET /api/maintenance` returns newest-first history with `200`.
- [ ] `POST /api/maintenance` creates a record with `201` and returns a stable response payload.
- [ ] `GET /health` returns `{ "status": "ok" }` without requiring a database query.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: endpoint responses and error shapes match the spec using local API requests.

**Dependencies:** Task 4

**Files likely touched:**
- `backend/src/routes/maintenance-routes.ts`
- `backend/src/routes/health-route.ts`
- `backend/src/server.ts`
- `backend/src/app.ts`
- `backend/tests/routes/maintenance-routes.test.ts`

**Estimated scope:** Medium

### Checkpoint: Backend Core

- [ ] All backend tests pass
- [ ] API contract is stable for jobs, history, create, and health
- [ ] Local backend can read/write against MySQL

### Phase 3: Frontend Shell and Shared Client

## Task 6: Create frontend app shell and API client

**Description:** Scaffold the React/Vite frontend with routing, TanStack Query provider, fetch-based API client, global styles, and the fixed pill-shaped bottom navigation. The shell should default to Maintenance and reserve safe-area space for iPhone use.

**Acceptance criteria:**
- [ ] React app uses routes for `/` and `/history`.
- [ ] Bottom navigation is fixed, pill-shaped, and safe-area aware.
- [ ] TanStack Query and API client are configured centrally without custom global caching.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: narrow-screen layout opens to Maintenance and navigation switches to History without page reload.

**Dependencies:** Task 1, Task 5

**Files likely touched:**
- `frontend/src/main.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/components/bottom-nav.tsx`
- `frontend/src/styles/app.css`

**Estimated scope:** Medium

## Task 7: Implement maintenance entry page

**Description:** Build the primary maintenance form with printer-hours input, previous-hours context, maintenance-job select, category toggle, conditional notes field, success feedback, lower-hours warning, and post-save reset/default behavior.

**Acceptance criteria:**
- [ ] Form accepts decimal printer hours and warns, but does not block, when value is below the most recent record.
- [ ] Notes field is shown for `ERROR` and optional for submission.
- [ ] Successful save updates query cache and resets the form without a full reload.
- [ ] Offline or network-unavailable submission is clearly blocked with user-facing feedback.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: submit a routine and an error record, observe success feedback, and confirm the next form state is useful.

**Dependencies:** Task 6

**Files likely touched:**
- `frontend/src/pages/maintenance-page.tsx`
- `frontend/src/components/maintenance-form.tsx`
- `frontend/src/hooks/use-maintenance-jobs.ts`
- `frontend/src/hooks/use-create-maintenance-record.ts`
- `frontend/src/utils/formatters.ts`

**Estimated scope:** Medium

## Task 8: Implement history page

**Description:** Build the mobile-friendly history view using cards/list rows rather than a wide desktop table. Include loading, empty, error, and large-list-friendly states while keeping the content hierarchy clear.

**Acceptance criteria:**
- [ ] History renders newest-first records with job, hours, category, date, and optional notes.
- [ ] Error records are visually distinguishable without relying on color alone.
- [ ] Empty, loading, and error states are present and styled for mobile.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: newly created records appear in History immediately after saving.

**Dependencies:** Task 6

**Files likely touched:**
- `frontend/src/pages/history-page.tsx`
- `frontend/src/components/history-list.tsx`
- `frontend/src/components/history-card.tsx`
- `frontend/src/hooks/use-maintenance-history.ts`
- `frontend/src/styles/history.css`

**Estimated scope:** Medium

### Checkpoint: Core User Flows

- [ ] End-to-end maintenance creation works
- [ ] History updates without full page reload
- [ ] Mobile shell and safe-area spacing behave correctly on narrow screens

### Phase 4: PWA and Production Serving

## Task 9: Add PWA manifest, icons, and service worker behavior

**Description:** Configure the frontend as an installable PWA with standalone launch behavior, Apple web app metadata, manifest, icons, and service worker caching suitable for static assets while avoiding duplicate offline writes.

**Acceptance criteria:**
- [ ] Manifest and metadata support iPhone home-screen installation and standalone launch.
- [ ] Service worker caches static assets appropriately.
- [ ] Mutation behavior does not queue unreliable offline submissions.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: production build exposes manifest/service worker assets and the app reports offline-aware messaging for create attempts.

**Dependencies:** Task 7, Task 8

**Files likely touched:**
- `frontend/vite.config.ts`
- `frontend/public/manifest.webmanifest`
- `frontend/public/icons/*`
- `frontend/src/pwa/register-sw.ts`
- `frontend/index.html`

**Estimated scope:** Medium

## Task 10: Serve compiled frontend from Fastify with SPA fallback

**Description:** Integrate the built frontend into the Fastify production server so non-API routes render the SPA, while `/api/*` and `/health` continue working. This task completes the single-service deployment architecture.

**Acceptance criteria:**
- [ ] Production Fastify server serves built static assets.
- [ ] Direct loads of `/` and `/history` work through SPA fallback.
- [ ] API routes remain isolated under `/api/*`.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: run the production server locally and verify `/`, `/history`, `/api/maintenance`, and `/health`.

**Dependencies:** Task 9

**Files likely touched:**
- `backend/src/server.ts`
- `backend/src/plugins/static-assets.ts`
- `package.json`
- `frontend/dist/*` (generated)

**Estimated scope:** Small

### Checkpoint: Production Architecture

- [ ] Single service serves frontend and API
- [ ] PWA assets are available in production build
- [ ] SPA fallback works for direct route loads

### Phase 5: Deployment, Documentation, and Final Verification

## Task 11: Add DigitalOcean App Platform configuration

**Description:** Define the App Platform service configuration for Node.js build/start commands, health checks, and required environment variables, assuming DigitalOcean Managed MySQL is attached separately.

**Acceptance criteria:**
- [ ] `.do/app.yaml` defines a single web service using the `PORT` environment variable.
- [ ] Build and run commands target the compiled frontend and backend artifacts.
- [ ] Health check points to `/health`.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: configuration clearly maps to one App Platform service and environment-driven database setup.

**Dependencies:** Task 10

**Files likely touched:**
- `.do/app.yaml`
- `package.json`

**Estimated scope:** Small

## Task 12: Document local setup, deployment, and verification

**Description:** Write complete README instructions for local development, database initialization, environment configuration, DigitalOcean Managed MySQL setup, App Platform deployment, and post-deploy verification of health and CRUD behavior.

**Acceptance criteria:**
- [ ] README explains local development, schema initialization, and required environment variables.
- [ ] README explains how to create and connect DigitalOcean Managed MySQL.
- [ ] README explains how to deploy to App Platform and verify `/health` and maintenance record persistence.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: a new developer could follow README steps without extra tribal knowledge.

**Dependencies:** Task 11

**Files likely touched:**
- `README.md`
- `.env.example`
- `.do/app.yaml`

**Estimated scope:** Small

## Task 13: Execute final end-to-end validation

**Description:** Run the full project validation suite and perform a final manual walk through the maintenance and history flows using the production build to ensure the delivered app meets the definition of done.

**Acceptance criteria:**
- [ ] Valid and invalid maintenance submissions behave as specified.
- [ ] History displays newest-first and reflects new records without page reload.
- [ ] Production build runs locally as a single service and matches the DigitalOcean deployment model.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: complete the full maintenance entry and history review workflow against MySQL.

**Dependencies:** Task 12

**Files likely touched:**
- no source changes expected; fixes only if verification reveals issues

**Estimated scope:** Small

### Checkpoint: Complete

- [ ] All acceptance criteria met
- [ ] Build, tests, and production start flow succeed
- [ ] Ready for implementation or review

## Parallelization Opportunities

- **Can parallelize after Task 5:** frontend shell work (Task 6) can proceed while a separate effort prepares deployment documentation stubs and icon assets, but API contracts must stay fixed.
- **Can parallelize after Task 6:** Task 7 and Task 8 can be split across separate sessions if both depend on the same stable API hooks and design tokens.
- **Should remain sequential:** schema, backend contract definition, static serving integration, and final production verification.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| App Platform build/start mismatch for monorepo layout | High | Define root scripts early and validate production build locally before writing deployment docs |
| MySQL driver/config complexity across local env vars and `DATABASE_URL` | Medium | Centralize parsing in one config module and test both config paths |
| PWA caching causing stale UI or duplicate submissions | High | Cache static assets only, avoid offline mutation queue, invalidate TanStack Query after successful writes |
| iPhone safe-area and bottom-nav overlap issues | Medium | Build shell mobile-first and test with narrow viewport spacing from the start |
| Task sprawl from greenfield setup | Medium | Keep tasks vertically sliced and checkpoint after each major phase |

## Open Questions

- No blocking product questions identified from the current spec.
- During implementation, the only likely choice needing confirmation is whether to use Vitest-only UI tests or add a small number of browser-level checks if the repository already supports them.

## Recommended Implementation Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9
10. Task 10
11. Task 11
12. Task 12
13. Task 13
