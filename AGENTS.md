# AGENTS.md — Lead Finder Agent

## Project Overview

Lead Finder Agent is a monorepo (npm workspaces) AI-powered lead discovery platform. It scrapes business leads from Google Maps, Justdial, and IndiaMart across configurable cities/areas in Indian states, stores them in MongoDB, and provides a CRM-style pipeline for managing them.

**Stack:**
- **Backend:** Express 4 + Mongoose 8.6 + TypeScript 5.5, port 5000
- **Frontend:** Next.js 15 App Router + React 19 + TypeScript 5.6, port 3000, proxies `/api/v1/*` → `localhost:5000`
- **AI Service:** Python FastAPI (uvicorn), port 8000 (separate workspace)
- **State:** Zustand (frontend), React Query (server state)
- **Styling:** Tailwind CSS + ShadCN UI + custom utility classes
- **Scraping:** Playwright (browser automation) + Cheerio (HTML parsing)
- **Auth:** JWT + bcryptjs, admin auto-seeded via `authService.ensureAdmin()`
- **Logging:** Pino (backend), morgan dev middleware
- **Validation:** Zod schemas (backend), express-validator
- **DB:** MongoDB with Mongoose 8.6 — `MONGODB_URI` in env

## Key Constraints & Conventions

- **Strict TypeScript** — no `any`, typed DTOs everywhere, `tsc --noEmit` must pass
- **No comments** in code unless explicitly asked
- **No emojis** in code or communication
- **One active scraping job at a time** per session (sequential processing within a session)
- **Real-time UI** — React Query polling (1.5s progress, 2s jobs, 5s sessions)
- **Error visibility** — every error logged and shown to user (red banner for action errors, amber for session load failures)
- **UUID string `_id`** on `AreaSessionModel` — `_id: { type: String }`, values from `randomUUID()`, NOT ObjectId
- **Job `_id`** is default ObjectId (MongoDB auto-generated)

## Project Structure

### Backend (`backend/src/`)

```
backend/src/
├── app.ts                        # Express entry: middleware, routes, server start
├── config/
│   ├── database.ts               # Mongoose connect/disconnect with retry
│   └── location-data.ts          # India states/cities/areas static data
├── automation/
│   ├── area-automation.types.ts  # Shared types: IAreaAutomationJob, IAreaAutomationSession, etc.
│   ├── area-automation.model.ts  # Mongoose schemas: AreaJobModel, AreaSessionModel
│   ├── area-automation-engine.ts # Orchestrator: start, stop, resume, getProgress, DTO mapping
│   ├── area-automation-queue.ts  # Per-session queue with Set/Map tracking, sequential processing
│   └── area-iterator.ts          # Iterates city→area pairs from location-data
├── controllers/
│   └── area-automation.controller.ts  # Express handlers for all /area-automation endpoints
├── routes/
│   ├── index.ts                  # Route aggregator (all routes under /api/v1)
│   └── area-automation.route.ts  # /area-automation/* routes
├── services/
│   ├── auth.service.ts           # Auth logic, admin seeding
│   ├── scraper.service.ts        # Scraping orchestration (Playwright/Cheerio)
│   └── crm.service.ts            # CRM pipeline operations
├── models/
│   ├── Lead.ts                   # Main lead schema (474 lines — CRM, scraping, validation fields)
│   ├── User.ts                   # Auth user schema
│   └── Automation.ts            # Legacy keyword/location automation schema
├── middlewares/
│   ├── auth.middleware.ts        # JWT authentication middleware
│   ├── error.middleware.ts       # Global error handler
│   ├── not-found.middleware.ts   # 404 handler
│   └── validation.middleware.ts  # express-validator error handler
├── utils/
│   ├── api-response.ts           # Standardized API response helper
│   ├── logger.ts                 # Pino logger instance
│   └── ...
├── schedulers/
│   └── cron.scheduler.ts         # Cron job scheduler
├── scrapers/                     # Scraper implementations (playwright-based)
├── validators/                   # Zod validation schemas
└── constants/                    # App constants (website statuses, lead sources, etc.)
```

### Frontend (`frontend/src/`)

```
frontend/src/
├── app/
│   ├── layout.tsx                # Root layout with Sidebar + Header
│   ├── providers.tsx             # QueryClient + Toaster providers
│   ├── (dashboard)/
│   │   └── automation/
│   │       └── page.tsx          # Area Automation dashboard (762 lines — full UI)
│   ├── search/page.tsx
│   ├── leads/page.tsx
│   └── settings/page.tsx
├── hooks/
│   └── useAreaAutomation.ts     # React Query hooks: sessions, progress, jobs, mutations
├── services/
│   └── area-automation.service.ts # API client: start, stop, resume, getSession, getJobs, etc.
├── components/
│   ├── ui/                       # ShadCN UI primitives (badge, button, card, tabs, etc.)
│   └── layout/                   # Sidebar, Header
├── store/                        # Zustand stores
├── utils/
│   ├── api-client.ts             # Axios instance with auth interceptor
│   └── api.ts                    # Old API utility
├── types/                        # Shared frontend types
├── config/                       # India states, location data
└── lib/                          # Library utilities
```

## API Endpoints (Area Automation)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/area-automation/start` | Start a new automation session |
| `GET` | `/api/v1/area-automation/sessions` | List recent sessions (query: `?limit=N`) |
| `GET` | `/api/v1/area-automation/sessions/:sessionId` | Get session progress (session + jobs + summary) |
| `GET` | `/api/v1/area-automation/sessions/:sessionId/jobs` | Get jobs with optional filters (`?status=&businessType=&city=`) |
| `POST` | `/api/v1/area-automation/sessions/:sessionId/stop` | Stop an active session |
| `POST` | `/api/v1/area-automation/sessions/:sessionId/resume` | Resume a stopped/completed session with skipped/pending jobs |
| `GET` | `/api/v1/area-automation/locations` | Get states/cities/areas (`?state=&city=`) |

Other routes: `/api/v1/health`, `/api/v1/auth/*`, `/api/v1/leads/*`, `/api/v1/search`, `/api/v1/export`, `/api/v1/extract-contact`, `/api/v1/automation`, `/api/v1/analytics`, `/api/v1/scraper`, `/api/v1/sources`, `/api/v1/crm`

## Automation Pipeline

### Architecture
1. **`AreaAutomationEngine`** — orchestrator singleton, creates sessions/jobs, delegates to queue
2. **`AreaAutomationQueue`** — per-session sequential processor using `Set<string>` + `Map<string, string|boolean>` for independent tracking
3. **`AreaIterator`** — generates city→area pairs from static location data
4. **`scraperService`** — runs Playwright-based scrapers against selected sources

### Data Flow
```
User clicks Start
  → Engine creates AreaSession (UUID _id) + AreaJob documents
  → Queue enqueues jobs (insertMany)
  → Engine calls queue.startProcessing(sessionId)
    → Queue loop: findOneAndUpdate next pending job → set to running
    → Call scraperService.scrapeBusinesses({keyword, location, sources, ...})
    → Scraper returns source results with counts
    → Job updated to completed with totalLeads, sourceResults
    → Session updated via $inc (completedJobs, totalLeads, runningJobs)
    → On error: failed status + failedReason
    → Loop continues until no more pending jobs or stop requested
```

### Stop / Resume
- **Stop:** sets `stopRequestedBySession[sessionId] = true` → loop exits → remaining pending jobs set to `skipped`
- **Resume:** resets `skipped` → `pending`, sets session `status: 'running'`, re-enters same processing loop

### Mongoose Schemas

**AreaSessionModel** (`_id: String`, UUID):
```
businessTypes: string[] | state: string | cities: string[] | sources: string[]
status: 'running' | 'completed' | 'failed'
totalJobs, completedJobs, failedJobs, runningJobs, skippedJobs, totalLeads: number
startedAt, completedAt: Date | null
```

**AreaJobModel** (default ObjectId `_id`):
```
sessionId: string | businessType, state, city, area: string
sources: string[] | status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
progress: string | totalLeads: number | sourceResults: AreaAutomationSourceResult[]
startedAt, completedAt: Date | null | failedReason: string | null
queuePosition: number | totalJobs: number
```

### DTO Pattern
Both backend (`area-automation.types.ts`) and frontend (`area-automation.service.ts`) define identical interfaces:
- `IAreaAutomationJob` / `AreaAutomationJob`
- `IAreaAutomationSession` / `AreaAutomationSession`
- `SessionSummary`
- `AreaAutomationProgress`
- `AreaAutomationSourceResult`
- `StartAutomationRequest`

Backend DTO functions (`toSessionDTO`, `toJobDTO`) use `unknown` param → `Record<string, unknown>` cast to accept both Mongoose documents and lean objects. `Date` fields are serialized to ISO strings.

### Frontend Hooks (`useAreaAutomation`)
- `startAutomation(data)` — mutation, auto-switches to new session
- `stopAutomation(sessionId)` — mutation
- `resumeAutomation(sessionId)` — mutation
- `sessions` — polling every 5s
- `useSessionProgress(sessionId)` — polling every 1.5s, returns `AreaAutomationProgress`
- `useSessionJobs(sessionId, filters)` — polling every 2s, returns `AreaAutomationJob[]`
- `startError` state exposed for UI error banners
- `activeSessionIds` — tracks running sessions across refreshes

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/automation/area-automation-engine.ts` | Engine with start/stop/resume/getProgress/DTOs |
| `backend/src/automation/area-automation-queue.ts` | Per-session sequential queue with Set/Map state |
| `backend/src/automation/area-automation.model.ts` | Mongoose schemas (session UUID string, job ObjectId) |
| `backend/src/automation/area-automation.types.ts` | Shared backend types |
| `backend/src/automation/area-iterator.ts` | City→area iteration from static data |
| `backend/src/controllers/area-automation.controller.ts` | Express handlers with validation/error handling |
| `backend/src/routes/area-automation.route.ts` | Route definitions |
| `frontend/src/hooks/useAreaAutomation.ts` | React Query hooks (sessions, progress, jobs, mutations) |
| `frontend/src/services/area-automation.service.ts` | API client (identical types to backend) |
| `frontend/src/app/(dashboard)/automation/page.tsx` | Full automation dashboard UI (control card, session view, history, error banners, resume button) |

## Production Startup (`scripts/start-production.sh`)

1. Builds backend (`npm run build`)
2. Starts backend (`NODE_ENV=production node dist/app.js`)
3. **Validates backend health** (waits up to 60s for `/api/health` to return `status: ok, database: connected`)
4. Only then starts ngrok tunnel
5. Auto-discovers ngrok URL via local API, updates `.env` and Netlify `_redirects`
6. Builds frontend and deploys to Netlify

## Standalone Validation (`scripts/validate-backend.sh`)

Waits for backend `/api/health` on port 5000 (configurable via `PORT` env, timeout via `HEALTH_TIMEOUT`):
```bash
bash scripts/validate-backend.sh                    # detect PID from port
bash scripts/validate-backend.sh --pid 12345        # explicit PID
HEALTH_TIMEOUT=30 bash scripts/validate-backend.sh  # custom timeout
```
Returns exit 0 on healthy, exit 1 on failure. Checks both `/api/health` and `/health`.

## Crash Recording

Unhandled rejections and exceptions write a `.crash-record` JSON file in `backend/` with:
- Memory usage (RSS, heap, external)
- Error name, message, truncated stack
- Uptime, Node version, platform, crash count
- Timestamp

## Development Commands

```bash
npm run dev              # Start frontend + backend + AI service concurrently
npm run dev:backend      # Backend only (ts-node-dev --respawn)
npm run dev:frontend     # Frontend only (next dev)
npm run typecheck        # tsc --noEmit on both backend and frontend
npm run lint             # ESLint on both
npm run build            # Build both for production
npm run start:production # Build + validate + ngrok + deploy (production)
cd backend && npm run seed:locations   # Seed location data from backend/
```

## Environment

**Backend `.env`:**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=http://localhost:3000
JWT_SECRET=...
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=ritesh.work.1510@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt hash>
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME="Lead Finder Agent"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Gotchas

- `AreaSessionModel._id` is explicitly `String` (UUID from `randomUUID()`) — `findByIdAndUpdate` works with string IDs because schema declares `_id: { type: String }`
- `toSessionDTO`/`toJobDTO` use `unknown` params with internal `Record<string, unknown>` cast — this is required to handle both Mongoose documents and `.lean()` plain objects
- Queue uses per-session `Set<string>` + `Map<string, string|boolean>` — NOT a global boolean. Sessions are independent.
- `$inc` for `runningJobs: +1` on job start, `$inc: runningJobs: -1` on completion/failure
- Resume reuses the same `startProcessing` loop — no separate code path
- Jobs are sorted by `queuePosition` ascending (insertion order)
- Session completion auto-detected in `getProgress` via `checkSessionCompletion`
- `start-production.sh` validates `/api/health` returns `{status:"ok", database:"connected"}` before starting ngrok — prevents 502s
- Crash records written to `backend/.crash-record` on unhandled rejections/exceptions — check this file first for post-mortem diagnostics
