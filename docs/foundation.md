# Foundation Plan: Printer Maintenance Tracker

## Overview

The repository currently contains only a minimal TypeScript scaffold. The foundation phase should create the project shape, tooling, and database baseline needed for all later backend, frontend, PWA, and deployment work without yet implementing the full product.

The goal of this phase is to leave the repo in a state where:

- frontend and backend app boundaries are established
- local development and production build flows are defined
- environment configuration is documented
- MySQL schema initialization is ready for a fresh database
- the repository can build and run predictable verification commands

## Foundation Decisions

- **Use one repository with separate `frontend/` and `backend/` apps** so React/Vite and Fastify stay isolated while deploying as one service later.
- **Use root-level orchestration scripts** so local and DigitalOcean workflows do not depend on manual directory changes.
- **Adopt npm workspaces** if possible, because they keep dependencies and scripts organized without adding extra tooling.
- **Treat `resources/schema.sql` as the database source of truth** from the start.
- **Keep the initial foundation shippable**: every task should end with a working build state.

## Dependency Graph

Repository structure
-> package/workspace configuration
-> frontend and backend app scaffolds
-> root scripts and env handling
-> MySQL schema and seed data
-> verification checkpoint

## Task List

## Task F1: Restructure the repository layout

**Description:** Replace the single-file scaffold with the target top-level layout so later work lands in stable locations. This task only establishes directories and removes ambiguity about where code should live.

**Acceptance criteria:**
- [ ] Repository contains `frontend/`, `backend/`, `resources/`, `.do/`, and `docs/`.
- [ ] Placeholder root `src/` no longer represents the main app entrypoint.
- [ ] `.gitignore` excludes standard Node, build, env, and local IDE artifacts for the new structure.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: repository tree clearly separates frontend, backend, infra, and docs concerns.

**Dependencies:** None

**Files likely touched:**
- `.gitignore`
- `package.json`
- `src/index.ts`
- `frontend/`
- `backend/`
- `resources/`
- `.do/`

**Estimated scope:** Small

## Task F2: Establish package management and root scripts

**Description:** Convert the repo from a single-package placeholder into a root orchestrator for frontend and backend development. Define install, build, test, and start commands that later DigitalOcean and local workflows can rely on unchanged.

**Acceptance criteria:**
- [ ] Root `package.json` defines scripts for `dev`, `build`, `test`, and `start`.
- [ ] Root setup can run frontend and backend scripts without manual `cd` steps.
- [ ] Dependency installation works predictably for the whole repository.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: `npm run dev` and `npm run test` have clear intended behavior even if later tasks still add more coverage.

**Dependencies:** Task F1

**Files likely touched:**
- `package.json`
- `package-lock.json`
- `frontend/package.json`
- `backend/package.json`

**Estimated scope:** Small

## Task F3: Scaffold the frontend application baseline

**Description:** Create the React + TypeScript + Vite application shell and its baseline project configuration, without yet implementing the full maintenance or history experiences. This is about making the frontend a real application target rather than a future placeholder.

**Acceptance criteria:**
- [ ] `frontend/` contains a Vite React TypeScript app with build and dev scripts.
- [ ] Frontend TypeScript and Vite config files are present and consistent with project conventions.
- [ ] A minimal app shell can build successfully.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: frontend output is emitted to a predictable build directory for later Fastify static serving.

**Dependencies:** Task F2

**Files likely touched:**
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/src/main.tsx`

**Estimated scope:** Medium

## Task F4: Scaffold the backend application baseline

**Description:** Create the Fastify + TypeScript backend skeleton and production entrypoint shape. This task should establish folders for routes, services, repositories, models, database, and validation so later API implementation has clear boundaries.

**Acceptance criteria:**
- [ ] `backend/` contains a Fastify TypeScript app with build and start scripts.
- [ ] Backend source tree includes `routes`, `services`, `repositories`, `models` or `types`, `database`, and `validation`.
- [ ] Backend compiles to a predictable output directory for production start.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: backend has a clear compiled server entrypoint path for App Platform.

**Dependencies:** Task F2

**Files likely touched:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/server.ts`
- `backend/src/routes/`
- `backend/src/services/`
- `backend/src/repositories/`
- `backend/src/models/`
- `backend/src/database/`
- `backend/src/validation/`

**Estimated scope:** Medium

## Task F5: Define environment and configuration contracts

**Description:** Document and wire the environment-variable contract the app will use locally and in DigitalOcean. The aim is to avoid future drift between local development, production deployment, and database connectivity assumptions.

**Acceptance criteria:**
- [ ] `.env.example` documents `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, and `PORT`.
- [ ] Root and backend scripts are compatible with environment-driven configuration.
- [ ] No secrets are committed to the repository.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: a developer can infer required local configuration from `.env.example` alone.

**Dependencies:** Task F2, Task F4

**Files likely touched:**
- `.env.example`
- `backend/src/config/`
- `README.md`
- `package.json`

**Estimated scope:** Small

## Task F6: Create the initial MySQL schema and seed data

**Description:** Add the first complete database initialization script for maintenance jobs and maintenance records, including indexes, constraints, and seed data. This completes the foundation by making the database bootstrappable before full API work starts.

**Acceptance criteria:**
- [ ] `resources/schema.sql` creates `maintenance_jobs` and `maintenance_records`.
- [ ] The schema enforces category values and the maintenance-job foreign key.
- [ ] The schema seeds the predefined maintenance jobs and adds indexes for history-oriented queries.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: applying `resources/schema.sql` to a fresh MySQL database succeeds without manual edits.

**Dependencies:** Task F1, Task F5

**Files likely touched:**
- `resources/schema.sql`
- `README.md`

**Estimated scope:** Small

## Task F7: Add baseline verification and foundation checkpoint

**Description:** Normalize the repository’s verification commands so the next phase starts from a stable base. This task is the final hardening pass for the foundation, not a feature implementation task.

**Acceptance criteria:**
- [ ] `npm run build` exercises both frontend and backend builds.
- [ ] `npm test` exists and runs the currently supported checks, even if early coverage is minimal.
- [ ] README includes the minimum local setup steps needed to validate the foundation.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: a fresh clone can follow the documented setup and reach a successful foundation build.

**Dependencies:** Task F3, Task F4, Task F5, Task F6

**Files likely touched:**
- `package.json`
- `README.md`
- `frontend/package.json`
- `backend/package.json`

**Estimated scope:** Small

## Checkpoint: Foundation Complete

- [ ] Repository structure matches the intended long-term architecture
- [ ] Frontend and backend both build through root scripts
- [ ] Environment contract is documented in `.env.example`
- [ ] `resources/schema.sql` initializes a fresh MySQL database
- [ ] README contains enough setup guidance to begin backend/API implementation

## Recommended Order

1. Task F1
2. Task F2
3. Task F3
4. Task F4
5. Task F5
6. Task F6
7. Task F7

## Parallelization Notes

- **Can parallelize after Task F2:** frontend scaffold and backend scaffold can be split if both teams agree on root script conventions first.
- **Can parallelize after Task F4:** `.env.example` and README setup notes can be drafted while schema work is in progress.
- **Should remain sequential:** repository restructuring, root scripts, and final verification.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Root scripts become coupled to local shell assumptions | Medium | Keep all commands cross-platform-friendly and directory-agnostic |
| Frontend and backend output paths conflict | Medium | Decide and document build output paths during scaffold setup |
| Foundation becomes a hidden feature build | High | Keep this phase focused on scaffolding, contracts, and verification only |
| Environment handling diverges between local and DigitalOcean | High | Define the variable contract once in `.env.example` and backend config |

## Definition of Done for Foundation

The foundation phase is complete when the repo has a production-oriented frontend/backend structure, root scripts, environment documentation, and a working MySQL schema initialization script, and all of that can be built and verified from the repository root.
