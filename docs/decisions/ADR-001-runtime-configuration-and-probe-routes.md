# ADR-001: Use repo-root environment loading and lightweight probe routes

## Status
Accepted

## Date
2026-08-09

## Context
The application is a monorepo with a root workspace orchestrator and a backend that runs from `backend/`.

Recent implementation work exposed three operational constraints:

- local setup instructions tell developers to create a repo-root `.env`
- the backend process runs with `process.cwd()` set to `backend/`, so default dotenv loading does not see the repo-root file
- DigitalOcean Managed MySQL requires TLS, while local MySQL may not

We also saw runtime probes hitting `GET /` and receiving Fastify's default 404 before frontend asset serving is in place.

The project already assumes a single-service deployment model where one Node process serves the API, health checks, and later the compiled frontend. That model needs a clear configuration boundary and predictable probe behavior during the intermediate backend-only phase.

## Decision
1. Load environment variables from the backend working directory first, then fall back to the repo root.
2. Extend the database environment contract with `DB_SSL_MODE` so TLS requirements are explicit and environment-driven.
3. Support lightweight probe responses on both `/health` and `/` with the same `{ "status": "ok" }` payload until the frontend-serving phase replaces `/` with the SPA entrypoint.

## Alternatives Considered

### Only load `.env` from `backend/`
- Pros: matches the backend process working directory exactly
- Cons: conflicts with the documented root-level setup and root-driven workflow
- Rejected: it creates unnecessary drift between documentation and runtime behavior

### Require `DATABASE_URL` only
- Pros: one variable can encode host, port, credentials, and database name
- Cons: makes local inspection and manual MySQL commands less ergonomic; does not clearly communicate TLS intent on its own in this codebase
- Rejected: the repo already documents discrete DB variables and uses them in local setup

### Leave `GET /` unhandled until SPA asset serving lands
- Pros: avoids adding a temporary route
- Cons: produces noisy 404s for platform probes and manual verification during the backend-only phase
- Rejected: a stable root response is more useful while the single-service deployment is still being assembled

## Consequences
- Developers can keep using the documented `cp .env.example .env` flow from the repository root.
- The backend can connect cleanly to managed MySQL instances that require TLS without changing code per environment.
- The environment contract now includes `DB_SSL_MODE`, which must stay documented in `.env.example` and deployment configuration.
- `/` is temporarily reserved as a liveness-style endpoint; when static frontend serving is implemented, that phase should supersede this part of the decision and document the new behavior in a follow-up ADR or update.
