# Data Layer and API Plan: Printer Maintenance Tracker

## Overview

The foundation phase established the repo structure, environment contract, backend skeleton, and initial MySQL schema. This phase should turn that scaffold into a real backend data layer and REST API for maintenance jobs, maintenance history, record creation, and health checks.

The goal is to leave the backend in a state where:

- MySQL connectivity is real rather than placeholder-only
- API contracts are explicit and type-safe
- validation, repository, service, and route boundaries are clear
- JSON error responses are consistent
- the frontend can start against stable `/api/*` endpoints

## Current Starting Point

- `resources/schema.sql` already defines `maintenance_jobs` and `maintenance_records`
- `backend/src/config/env.ts` already loads `PORT`, `DATABASE_URL`, and discrete DB variables
- `backend/src/database/config.ts` currently shapes connection config but does not connect to MySQL
- `backend/src/routes/index.ts` currently exposes only a placeholder `/`
- backend folders for `routes`, `services`, `repositories`, `models`, `database`, and `validation` already exist

## Architecture Decisions

- **Keep schema as source of truth**: the API layer should adapt to `resources/schema.sql`, not invent a parallel model.
- **Use a real MySQL driver with pooled connections**: one shared pool is simpler and safer than ad hoc per-request connections.
- **Separate query code from business rules**: repositories handle SQL and row mapping, services handle validation outcomes and orchestration.
- **Use explicit DTOs**: database row shapes and HTTP response shapes should not be treated as the same type automatically.
- **Return consistent JSON errors**: validation, not-found, and unexpected failures should share one error envelope.
- **Keep health lightweight**: `/health` should not depend on a live query.

## Dependency Graph

Schema + env contract
-> MySQL connection layer
-> domain types + API response types
-> validation + error helpers
-> repositories
-> services
-> routes
-> route/integration tests

## Task List

### Phase 1: Data Foundations

## Task A1: Finalize backend contracts and shared types

**Description:** Replace the current placeholder backend types with concrete maintenance-domain and API contract types. This includes create-record input, history output, jobs output, and the standard error response shape the routes will use.

**Acceptance criteria:**
- [ ] Backend types cover maintenance jobs, maintenance records, create-record input, and API error payloads.
- [ ] Types distinguish between database-oriented shapes and HTTP response shapes where needed.
- [ ] Category values remain constrained to `ROUTINE` and `ERROR`.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: routes, services, and repositories can all reference stable shared types without local redefinition.

**Dependencies:** None

**Files likely touched:**
- `backend/src/models/maintenance.ts`
- `backend/src/types/api.ts`

**Estimated scope:** Small

## Task A2: Implement real MySQL connectivity

**Description:** Replace the current connection-config placeholder with a real MySQL database module. It should support either `DATABASE_URL` or the discrete `DB_*` variables already documented in the foundation phase and expose a pooled connection interface for repository use.

**Acceptance criteria:**
- [ ] Backend creates a reusable MySQL connection pool.
- [ ] Connection setup supports both `DATABASE_URL` and discrete DB configuration.
- [ ] Backend fails clearly on invalid or incomplete database configuration instead of silently running with a broken setup.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: backend starts with valid database configuration and repository code can request a connection from the shared pool.

**Dependencies:** Task A1

**Files likely touched:**
- `backend/package.json`
- `backend/src/config/env.ts`
- `backend/src/database/mysql.ts`
- `backend/src/database/config.ts`

**Estimated scope:** Medium

### Checkpoint: Data Foundations

- [ ] Shared backend contracts are stable
- [ ] MySQL connectivity is wired and reusable
- [ ] Build and tests still pass

### Phase 2: Core Data Access and Validation

## Task A3: Implement validation and error helpers

**Description:** Add request validation for maintenance creation and a shared error model for route handlers. This task should define how invalid payloads, missing jobs, and unexpected failures are represented before the endpoints are fully built.

**Acceptance criteria:**
- [ ] Validation rejects negative printer hours, invalid categories, missing required fields, and malformed numeric values.
- [ ] Validation allows optional notes and supports routine records with no notes.
- [ ] Shared error helpers can represent `400`, `404`, and `500` responses consistently.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: service and route layers can consume validation results without duplicating error-shaping logic.

**Dependencies:** Task A1, Task A2

**Files likely touched:**
- `backend/src/validation/maintenance.ts`
- `backend/src/services/errors.ts`
- `backend/src/types/api.ts`

**Estimated scope:** Medium

## Task A4: Implement the maintenance jobs read path

**Description:** Deliver the first complete vertical slice by building the repository, service, route, and tests for `GET /api/maintenance/jobs`. This endpoint is low risk, depends on seeded data already present in `schema.sql`, and establishes the stack pattern the other endpoints will follow.

**Acceptance criteria:**
- [ ] Repository returns active jobs ordered consistently.
- [ ] Service exposes jobs without leaking raw SQL concerns to the route layer.
- [ ] `GET /api/maintenance/jobs` returns `200` with the expected JSON payload.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: calling `GET /api/maintenance/jobs` against a seeded database returns the predefined maintenance job list.

**Dependencies:** Task A2, Task A3

**Files likely touched:**
- `backend/src/repositories/maintenance-jobs-repository.ts`
- `backend/src/services/maintenance-service.ts`
- `backend/src/routes/maintenance-routes.ts`
- `backend/tests/routes/maintenance-jobs.test.ts`

**Estimated scope:** Medium

## Task A5: Implement the maintenance creation path

**Description:** Deliver the record-creation slice across validation, repository, service, route, and tests for `POST /api/maintenance`. This task should enforce job existence, preserve decimal printer hours, and return a stable success response with `201`.

**Acceptance criteria:**
- [ ] `POST /api/maintenance` accepts valid create payloads and stores records in MySQL.
- [ ] Invalid payloads return `400` and missing maintenance jobs return `404`.
- [ ] Notes remain optional and category handling matches the schema contract.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: a valid request creates a database row and returns a `201` response without exposing raw SQL errors.

**Dependencies:** Task A3, Task A4

**Files likely touched:**
- `backend/src/repositories/maintenance-records-repository.ts`
- `backend/src/services/maintenance-service.ts`
- `backend/src/routes/maintenance-routes.ts`
- `backend/tests/routes/create-maintenance.test.ts`

**Estimated scope:** Medium

### Checkpoint: Write Path Complete

- [ ] Jobs endpoint works from seeded data
- [ ] Create endpoint persists valid records
- [ ] Validation and error handling match the spec

### Phase 3: Query Path and HTTP Surface

## Task A6: Implement the maintenance history read path

**Description:** Build the repository, service, route, and tests for `GET /api/maintenance`. This path should join records to job names, order newest-first, and return the fields the frontend will need for the mobile history view.

**Acceptance criteria:**
- [ ] Repository returns history joined to maintenance jobs and ordered newest-first.
- [ ] Service maps the data into a frontend-ready response shape with date, hours, category, notes, and job name.
- [ ] `GET /api/maintenance` returns `200` and handles the empty-history case cleanly.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: records created through `POST /api/maintenance` appear in history with newest entries first.

**Dependencies:** Task A5

**Files likely touched:**
- `backend/src/repositories/maintenance-records-repository.ts`
- `backend/src/services/maintenance-service.ts`
- `backend/src/routes/maintenance-routes.ts`
- `backend/tests/routes/maintenance-history.test.ts`

**Estimated scope:** Medium

## Task A7: Finalize route registration and health/error behavior

**Description:** Replace the placeholder root-only route registration with the production API surface: `/api/maintenance/jobs`, `/api/maintenance`, and `/health`. This task should also centralize unexpected error handling so the API returns predictable JSON responses across endpoints.

**Acceptance criteria:**
- [ ] Fastify registers `/api/maintenance/jobs`, `/api/maintenance`, and `/health`.
- [ ] `/health` returns `{ "status": "ok" }` without needing a database query.
- [ ] Unexpected failures return a consistent JSON error envelope instead of raw Fastify or database errors.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: direct requests to `/health` and all `/api/*` routes return the intended status codes and payload shapes.

**Dependencies:** Task A4, Task A5, Task A6

**Files likely touched:**
- `backend/src/app.ts`
- `backend/src/routes/index.ts`
- `backend/src/routes/health-route.ts`
- `backend/src/routes/maintenance-routes.ts`

**Estimated scope:** Medium

### Checkpoint: API Ready

- [ ] All required backend endpoints exist
- [ ] Errors are consistent across routes
- [ ] Local backend can read/write against MySQL
- [ ] Frontend work can start against a stable API contract

## Recommended Order

1. Task A1
2. Task A2
3. Task A3
4. Task A4
5. Task A5
6. Task A6
7. Task A7

## Parallelization Notes

- **Can parallelize after Task A1:** one stream can prepare database connectivity while another drafts API types and route tests, but the type contract must stay fixed.
- **Can parallelize after Task A3:** jobs endpoint and some route-test scaffolding can proceed in parallel with create/history repository preparation.
- **Should remain sequential:** connection layer, create-path validation rules, final route registration, and shared error handling.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MySQL config edge cases across `DATABASE_URL` and `DB_*` variables | High | Centralize config parsing and test both setup paths early |
| Decimal printer hours get coerced inconsistently between MySQL, TypeScript, and JSON | High | Define one canonical representation at the repository and API boundaries |
| Validation and schema constraints drift apart | Medium | Keep validation rules aligned to `resources/schema.sql` and reuse shared category constants |
| Route tests become brittle if they rely on a live shared database | Medium | Keep repository and route boundaries explicit so tests can isolate or control database setup |
| Placeholder foundation routes leak into production surface | Low | Replace the root-only placeholder registration as the final API hardening step |

## Open Questions

- Whether backend tests should use a real MySQL test database or a thinner route/service testing approach is still an implementation decision.
- If route-level schema validation will rely on Fastify schemas, a library such as Zod, or custom validation helpers should be decided before Task A3 begins.

## Definition of Done for Data Layer and API

This phase is complete when the backend exposes stable `GET /api/maintenance/jobs`, `GET /api/maintenance`, `POST /api/maintenance`, and `GET /health` endpoints backed by MySQL, with shared validation, repository/service layering, consistent JSON errors, and passing root-level test and build commands.
