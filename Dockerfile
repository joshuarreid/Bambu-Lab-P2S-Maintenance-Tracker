# ── Stage 1: build frontend ───────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN npm ci

COPY frontend/ ./frontend/
COPY tsconfig.json ./

RUN npm run build --workspace frontend

# ── Stage 2: build backend ────────────────────────────────────
FROM node:20-alpine AS backend-build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN npm ci

COPY backend/ ./backend/
COPY tsconfig.json ./

RUN npm run build --workspace backend

# ── Stage 3: production image ─────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=backend-build /app/backend/dist ./backend/dist

# Copy compiled frontend (served as static files by the backend)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "backend/dist/server.js"]
