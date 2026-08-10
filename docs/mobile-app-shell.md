# Mobile App Shell Plan: Printer Maintenance Tracker

## Overview

The backend API now exists and the frontend still consists of a minimal placeholder shell. This phase should turn the frontend into a real mobile-first application shell that can host the maintenance and history experiences on iPhone-sized screens.

The goal is to leave the frontend in a state where:

- routing exists for `/` and `/history`
- TanStack Query is configured once at the app boundary
- a shared API client exists for backend communication
- the layout is mobile-first and safe-area aware
- a fixed pill-shaped bottom navigation controls the two primary destinations

## Current Starting Point

- `frontend/src/app.tsx` is a single placeholder component
- `frontend/src/main.tsx` renders the placeholder shell directly
- `frontend/src/styles.css` contains only base foundation styling
- backend routes now expose `/api/maintenance/jobs`, `/api/maintenance`, `POST /api/maintenance`, and `/health`
- no frontend routing, query provider, API client, or navigation components exist yet

## Architecture Decisions

- **Use React Router for the two app destinations** so `/` and `/history` can be deep-linked and later served through SPA fallback.
- **Configure TanStack Query at the application root** so maintenance and history pages share one server-state layer.
- **Use one shared fetch-based API client** rather than page-level ad hoc fetch calls.
- **Build the shell mobile-first** with safe-area spacing and touch-friendly layout before implementing feature pages.
- **Use page-level placeholders first** so the navigation and layout can be verified independently of the maintenance/history feature details.
- **Keep shell concerns separate from page logic** by isolating layout, navigation, routing, and API plumbing.

## Dependency Graph

Router + query provider setup
-> shared API client
-> application layout shell
-> bottom navigation
-> maintenance and history page placeholders
-> shell-level styling and safe-area behavior

## Task List

### Phase 1: App Shell Foundations

## Task S1: Add frontend routing and app composition

**Description:** Replace the current single-component frontend entry with a real application composition layer. This task should introduce React Router, define the two routes, and restructure `main.tsx`/`app.tsx` so the rest of the shell can plug into stable boundaries.

**Acceptance criteria:**
- [ ] Frontend uses routes for `/` and `/history`.
- [ ] App entrypoint renders through a router-aware composition instead of a single placeholder card.
- [ ] Direct rendering concerns are separated from page components and shell layout.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: navigating between `/` and `/history` works locally without a full page reload.

**Dependencies:** None

**Files likely touched:**
- `frontend/package.json`
- `frontend/src/main.tsx`
- `frontend/src/app.tsx`
- `frontend/src/router.tsx`

**Estimated scope:** Medium

## Task S2: Add TanStack Query provider and shared API client

**Description:** Establish the frontend’s shared data-access layer before building real pages. This task should add TanStack Query, create one fetch-based API client module, and configure the root provider so future maintenance and history hooks can reuse it without custom caches.

**Acceptance criteria:**
- [ ] TanStack Query is installed and configured once at the app boundary.
- [ ] A shared API client exists for `/api/maintenance` and `/api/maintenance/jobs` communication.
- [ ] The shell is ready for page-level query hooks without introducing a separate global data cache.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: page components can import the query client and API client without circular wiring.

**Dependencies:** Task S1

**Files likely touched:**
- `frontend/package.json`
- `frontend/src/main.tsx`
- `frontend/src/lib/query-client.ts`
- `frontend/src/api/client.ts`

**Estimated scope:** Small

### Checkpoint: Shell Foundations

- [ ] Routing is in place
- [ ] Query provider is configured
- [ ] Shared API client exists

### Phase 2: Mobile Layout and Navigation

## Task S3: Build the safe-area-aware application layout

**Description:** Create the persistent mobile application frame that reserves room for content and bottom navigation on narrow iPhone screens. This task should define the page container, content region, spacing strategy, and safe-area handling independently of final page behavior.

**Acceptance criteria:**
- [ ] Layout is mobile-first and optimized for narrow widths.
- [ ] Safe-area padding is applied so content and navigation do not collide with the iOS home indicator.
- [ ] The shell provides reusable structure for both Maintenance and History pages.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: the shell looks intentional on a narrow viewport and leaves space for fixed bottom navigation.

**Dependencies:** Task S1

**Files likely touched:**
- `frontend/src/components/app-shell.tsx`
- `frontend/src/styles.css`
- `frontend/src/app.tsx`

**Estimated scope:** Medium

## Task S4: Implement the pill-shaped bottom navigation

**Description:** Add the fixed bottom navigation bar that switches between Maintenance and History. The control should look like a modern iOS utility navigation element, be reachable one-handed, and reflect the active route clearly.

**Acceptance criteria:**
- [ ] Bottom navigation is fixed near the bottom of the viewport and pill-shaped.
- [ ] Navigation exposes exactly two primary destinations: Maintenance and History.
- [ ] Active-state styling is clear and not dependent on desktop navigation patterns.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: tapping each nav item switches routes and the active destination is visually obvious.

**Dependencies:** Task S3

**Files likely touched:**
- `frontend/src/components/bottom-nav.tsx`
- `frontend/src/components/app-shell.tsx`
- `frontend/src/styles.css`

**Estimated scope:** Medium

## Task S5: Add page-level placeholders for Maintenance and History

**Description:** Create simple route targets for the two primary screens so the shell can be verified end-to-end before the full maintenance form and history list are built. These should establish consistent page headings, layout hooks, and page boundaries without yet implementing the complete feature bodies.

**Acceptance criteria:**
- [ ] `/` renders a Maintenance page placeholder inside the mobile shell.
- [ ] `/history` renders a History page placeholder inside the mobile shell.
- [ ] Page boundaries are structured so later feature work can replace placeholders without reworking the shell.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: both destinations render correctly within the same shell and navigation frame.

**Dependencies:** Task S3, Task S4

**Files likely touched:**
- `frontend/src/pages/maintenance-page.tsx`
- `frontend/src/pages/history-page.tsx`
- `frontend/src/router.tsx`
- `frontend/src/app.tsx`

**Estimated scope:** Medium

### Checkpoint: Mobile Shell Working

- [ ] App opens to Maintenance
- [ ] Bottom navigation switches between the two destinations
- [ ] Narrow-screen layout and safe-area spacing are working

### Phase 3: Shell Hardening

## Task S6: Normalize shell styling and interaction states

**Description:** Refine the shared frontend styling so the mobile shell feels cohesive rather than scaffold-like. This includes typography hierarchy, spacing rhythm, touch-target sizing, active/inactive nav states, and shell-level color usage appropriate for a utility-style app.

**Acceptance criteria:**
- [ ] Shared styles support large touch targets and readable typography on iPhone screens.
- [ ] Visual hierarchy distinguishes shell, navigation, and page content areas cleanly.
- [ ] Styles avoid desktop-first layout assumptions such as wide containers or top-nav emphasis.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: the shell feels like a mobile app frame rather than a centered desktop card.

**Dependencies:** Task S4, Task S5

**Files likely touched:**
- `frontend/src/styles.css`
- `frontend/src/components/bottom-nav.tsx`
- `frontend/src/components/app-shell.tsx`

**Estimated scope:** Medium

## Task S7: Add shell-level frontend verification coverage

**Description:** Add the minimal tests needed to lock in routing, default destination, and shell rendering behavior. This should protect the app shell before the maintenance and history feature pages begin changing more rapidly.

**Acceptance criteria:**
- [ ] Frontend tests cover default Maintenance rendering and route switching at the shell level.
- [ ] Verification commands continue to run from the repo root.
- [ ] The shell can evolve into feature pages without losing route/navigation guarantees.

**Verification:**
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: shell behavior matches the plan after tests are added.

**Dependencies:** Task S5, Task S6

**Files likely touched:**
- `frontend/package.json`
- `frontend/src/app.tsx`
- `frontend/src/router.tsx`
- `frontend/tests/app-shell.test.tsx`

**Estimated scope:** Medium

### Checkpoint: Shell Complete

- [ ] Routing, navigation, and layout are stable
- [ ] TanStack Query and API plumbing are ready for feature work
- [ ] Frontend shell behavior is covered by tests
- [ ] Maintenance-form and history-feature implementation can begin on top of a stable shell

## Recommended Order

1. Task S1
2. Task S2
3. Task S3
4. Task S4
5. Task S5
6. Task S6
7. Task S7

## Parallelization Notes

- **Can parallelize after Task S2:** layout work and API-client cleanup can proceed separately if the root composition is stable.
- **Can parallelize after Task S4:** page placeholders and shell styling refinement can be split across separate sessions.
- **Should remain sequential:** router setup, query provider wiring, and the final shell verification coverage.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shell structure gets coupled too tightly to placeholder page content | Medium | Keep page components shallow and put persistent concerns in shell components |
| Safe-area spacing looks correct on desktop but fails on iPhone | High | Build spacing around fixed bottom navigation and mobile-first viewport assumptions from the start |
| Data layer setup leaks into page-specific logic too early | Medium | Keep API client and query provider generic; defer page hooks until maintenance/history implementation |
| Navigation styling drifts toward a desktop tab bar look | Low | Anchor the design around a bottom pill control with touch targets and iOS-like spacing |
| No frontend test coverage for routing and shell state | Medium | Add focused shell tests before moving on to feature pages |

## Open Questions

- Whether frontend shell tests should use Vitest with React Testing Library or another lightweight runner depends on the frontend testing tools you want to standardize on next.
- If the shell should include a lightweight page title/header pattern now or wait for the maintenance/history feature work can be decided during implementation.

## Definition of Done for Mobile App Shell

This phase is complete when the React frontend opens to a Maintenance route inside a safe-area-aware mobile shell, exposes a fixed pill-shaped bottom navigation for Maintenance and History, configures TanStack Query and a shared API client at the root, and includes enough test coverage to keep those shell guarantees stable for the next feature phase.
