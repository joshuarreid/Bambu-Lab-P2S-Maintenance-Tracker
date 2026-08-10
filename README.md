# Bambu-Lab-P2S-Maintenance-Tracker

Foundation for a mobile-first printer maintenance tracker built with React, Vite, Fastify, TypeScript, and MySQL.

## Repository Structure

```text
.
├── backend/      # Fastify API foundation
├── frontend/     # React + Vite application foundation
├── resources/    # Database schema and seed data
├── docs/         # Planning and implementation docs
└── .do/          # DigitalOcean App Platform config placeholder
```

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Update the MySQL values in `.env` for your database. Set `DB_SSL_MODE=REQUIRED` for managed databases that require TLS, such as DigitalOcean Managed Databases.

4. Initialize the database:

   ```bash
   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < resources/schema.sql
   ```

## Development Commands

- `npm run dev` - starts the frontend and backend workspaces together
- `npm test` - runs the current workspace verification checks
- `npm run build` - builds the frontend and backend production artifacts
- `npm run start` - starts the compiled backend server

## Architecture

The project currently uses a single-service deployment model with one Fastify backend and one React frontend in a monorepo. Architectural decisions are recorded in `docs/decisions/`, starting with `ADR-001-runtime-configuration-and-probe-routes.md`.

## Foundation Status

The foundation phase currently provides:

- npm workspaces for frontend and backend
- a minimal React + Vite application shell
- a minimal Fastify server with environment loading
- the initial MySQL schema and seeded maintenance jobs
- root-level scripts for dev, test, build, and start

The maintenance workflows, REST API endpoints, PWA behavior, and DigitalOcean deployment config are planned next.
