# Lead Finder Agent

AI-powered lead discovery and management platform. Scrapes business leads from Google Maps, Justdial, IndiaMart, and Clutch across configurable cities/areas in Indian states, enriches them with AI analysis, and provides a full CRM-style pipeline for management and outreach.

## Features

- **Area Automation**: Mass scraping across cities/areas for multiple business types with stop/resume
- **CRM Pipeline**: Customizable lead stages with drag-and-drop reordering
- **Business Intelligence**: Trust scoring, website quality, social presence, freshness detection
- **Responsive Audit**: Mobile-friendly, UI/UX, layout-break, and performance assessment
- **AI Analysis**: Lead scoring, qualification, opportunity detection, summary generation (Python FastAPI)
- **Sales Intelligence**: Lead scoring, conversion prediction, revenue forecasting, competitor analysis
- **AI Outreach**: Cold email generation, proposal generation, WhatsApp messages, follow-up sequences
- **AI Validation**: Business relevance, location validation, keyword intelligence, rejection engine
- **WhatsApp Automation**: Web-based WhatsApp messaging for outreach
- **Semantic Search**: AI-powered lead search with natural language queries
- **UI/UX Intelligence**: Layout break detection, responsive score engine, viewport checker
- **Export**: CSV and Excel export with custom field selection
- **Real-time Updates**: React Query polling (1.5s progress, 2s jobs, 5s sessions)
- **A4 Reports**: Professional white-themed documentation with detailed insights (HTML + PDF)
- **Automation Monitor**: Real-time execution logs with Socket.io monitoring
- **Contact Extraction**: Automatic contact info extraction from business websites

## Architecture

Monorepo with three workspaces:

```
lead-finder-agent/
├── frontend/          # Next.js 15 App Router (port 3000)
├── backend/           # Express.js + TypeScript API (port 5000)
└── ai-service/        # Python FastAPI (port 8000)
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15 App Router + React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + ShadCN UI
- **State Management**: Zustand (client) + React Query TanStack (server)
- **HTTP Client**: Axios with auth interceptor
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **Drag & Drop**: dnd-kit
- **Icons**: Lucide React
- **Toasts**: Sonner
- **WebSocket**: Socket.io client

### Backend
- **Runtime**: Node.js + Express 4
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose 8.6
- **Validation**: Zod + express-validator
- **Auth**: JWT + bcryptjs, admin auto-seeded
- **Scraping**: Playwright + Cheerio
- **Logging**: Pino + Morgan
- **Security**: Helmet, CORS, compression
- **Export**: ExcelJS, CSV write stream
- **Scheduling**: node-cron
- **Concurrency**: p-limit
- **PDF**: Puppeteer
- **WebSocket**: Socket.io
- **AI Client**: OpenAI SDK, Google Generative AI, Anthropic SDK

### AI Service
- **Framework**: Python FastAPI (uvicorn)
- **Validation**: Pydantic v2
- **HTTP**: httpx
- **Logging**: loguru
- **Purpose**: Lead analysis, scoring, qualification, website analysis, and business opportunity detection

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (Atlas or local)
- Python 3.10+ (for AI service)
- Playwright browsers (for scraping)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ritesh151/Lead-Finder-Project.git
cd Lead-Finder-Project
```

2. Install all dependencies:
```bash
npm install
```

3. Setup environment variables:

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, JWT secret, and admin credentials
```

**Frontend:**
```bash
# frontend/.env.local already exists with defaults
```

**AI Service:**
```bash
cp ai-service/.env.example ai-service/.env
```

4. Start development servers:
```bash
# Start all three services
npm run dev

# Or start individually
npm run dev:backend    # Backend on port 5000 (ts-node-dev --respawn)
npm run dev:frontend   # Frontend on port 3000 (next dev)
npm run dev:ai         # AI service on port 8000 (uvicorn)
```

## Available Scripts

```bash
npm run dev           # Start all services concurrently
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
npm run dev:ai        # AI service only
npm run build         # Build backend (tsc) + frontend (next build)
npm run typecheck     # tsc --noEmit on both workspaces
npm run lint          # ESLint on both workspaces
```

## Project Structure

### Frontend
```
frontend/src/
├── middleware.ts                    # Route protection (redirects to /login)
├── app/
│   ├── globals.css                  # Tailwind imports + global styles
│   ├── layout.tsx                   # Root layout with Inter font + Providers
│   ├── providers.tsx                # QueryClient + Sonner Toaster + Devtools
│   ├── index.ts
│   ├── login/page.tsx               # Admin login
│   └── (dashboard)/
│       ├── layout.tsx               # Dashboard shell: Sidebar + Header + AuthHydrator
│       ├── page.tsx                 # Dashboard home (stats, features)
│       ├── analytics/page.tsx       # Analytics dashboard
│       ├── automation/
│       │   ├── page.tsx             # Area Automation UI
│       │   └── [id]/monitor/page.tsx
│       ├── crm/page.tsx             # CRM pipeline board
│       ├── leads/page.tsx           # Lead list with filters
│       ├── logic-module/page.tsx    # Logic module configuration
│       ├── search/
│       │   ├── page.tsx             # Business search
│       │   └── history/page.tsx     # Search history
│       ├── settings/page.tsx        # Settings
│       └── whatsapp-automation/page.tsx
├── components/
│   ├── analytics/
│   │   ├── AreaHeatmap.tsx
│   │   ├── ResponsiveAuditStats.tsx
│   │   └── TopAreasChart.tsx
│   ├── auth/
│   │   └── AuthHydrator.tsx         # Restores auth state on mount
│   ├── automation/                  # 9 automation components
│   │   ├── AutomationActionsDropdown.tsx
│   │   ├── AutomationCreateModal.tsx
│   │   ├── AutomationDeleteModal.tsx
│   │   ├── AutomationEmptyState.tsx
│   │   ├── AutomationFilters.tsx
│   │   ├── AutomationProgress.tsx
│   │   ├── AutomationStats.tsx
│   │   ├── AutomationTable.tsx
│   │   └── StatusBadge.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx              # App sidebar navigation
│   │   └── Header.tsx               # Top header bar
│   ├── leads/                       # 9 lead components
│   │   ├── audit-actions.tsx
│   │   ├── audit-status-badge.tsx
│   │   ├── lead-card.tsx
│   │   ├── lead-details-dialog.tsx
│   │   ├── lead-grid.tsx
│   │   ├── lead-list.tsx
│   │   ├── lead-social-icons.tsx
│   │   ├── responsive-audit-badge.tsx
│   │   └── responsive-audit-detail.tsx
│   ├── location/
│   │   └── cascading-location-select.tsx
│   ├── logic-module/                # 6 visualization components
│   │   ├── AnimatedPipeline.tsx
│   │   ├── ArchitectureGraph.tsx
│   │   ├── EngineSection.tsx
│   │   ├── LogicCard.tsx
│   │   ├── LogicFlow.tsx
│   │   └── ScoreMeter.tsx
│   ├── search/
│   │   ├── lead-location-summary.tsx
│   │   └── search-history.tsx
│   └── ui/                          # 17 ShadCN UI primitives
│       ├── alert.tsx, avatar.tsx, badge.tsx, button.tsx
│       ├── card.tsx, checkbox.tsx, cn.tsx, dialog.tsx
│       ├── dropdown-menu.tsx, input.tsx, label.tsx
│       ├── pagination.tsx, searchable-select.tsx
│       ├── select.tsx, separator.tsx, table.tsx, tabs.tsx
├── config/                          # 5 location config files
│   ├── city-coordinates.ts
│   ├── india-states.ts
│   ├── location-data.ts
│   ├── location-types.ts
│   └── index.ts
├── data/
│   └── logicModuleData.ts
├── hooks/                           # 20 React Query hooks
│   ├── useAnalytics.ts
│   ├── useAreaAutomation.ts
│   ├── useAutomationMonitor.ts
│   ├── useBusinessIntelligence.ts
│   ├── useDashboard.ts
│   ├── useLeadAuditTrigger.ts
│   ├── useLeadFilters.ts
│   ├── useLeads.ts
│   ├── useMegaAI.ts
│   ├── useOutreach.ts
│   ├── useProtectedRoute.ts
│   ├── useReport.ts
│   ├── useResponsiveAudit.ts
│   ├── useSalesIntelligence.ts
│   ├── useSearchSocket.ts
│   ├── useTheme.ts
│   ├── useWebsiteIntelligence.ts
│   ├── useWhatsAppAutomation.ts
│   └── useWhatsAppCampaign.ts
├── lib/
│   ├── utils.ts
│   └── index.ts
├── services/                        # 20 API client modules
│   ├── analytics.service.ts
│   ├── area-automation.service.ts
│   ├── auth.service.ts
│   ├── automation-monitor.service.ts
│   ├── automation.service.ts
│   ├── business-intelligence.service.ts
│   ├── crm.service.ts
│   ├── lead.service.ts
│   ├── mega-ai.service.ts
│   ├── outreach.service.ts
│   ├── report.service.ts
│   ├── responsive-audit.service.ts
│   ├── sales-intelligence.service.ts
│   ├── scraper.service.ts
│   ├── search-status.service.ts
│   ├── website-classification.service.ts
│   ├── website-intelligence.service.ts
│   ├── whatsapp-automation.service.ts
│   └── whatsapp-campaign.service.ts
├── store/                           # 7 Zustand stores
│   ├── useAnalyticsStore.ts
│   ├── useAuthStore.ts
│   ├── useCRMStore.ts
│   ├── useLeadFilterStore.ts
│   ├── useLeadStore.ts
│   ├── useSearchAlertStore.ts
│   └── useSearchStore.ts
├── types/
│   ├── analytics.ts
│   ├── index.ts
│   └── responsive-audit.types.ts
└── utils/                           # 8 utility modules
    ├── api-client.ts, api.ts
    ├── auth-persistence.ts, cn.ts
    ├── formatter.ts, index.ts
    ├── logger.ts, socket-client.ts
```

### Backend
```
backend/src/
├── app.ts                           # Express entry: middleware, routes, DB, graceful shutdown
├── seed.ts                          # Database seeding script
├── ai-outreach/                     # AI-powered outreach (12 modules)
│   ├── cold-email-engine.ts
│   ├── followup-sequence-engine.ts
│   ├── outreach-history.service.ts
│   ├── outreach-report-generator.ts
│   ├── outreach-score-engine.ts
│   ├── personalization-engine.ts
│   ├── proposal-generator.ts
│   ├── redesign-proposal-engine.ts
│   ├── seo-proposal-engine.ts
│   ├── whatsapp-message-engine.ts
│   ├── ai-pitch-generator.ts
│   └── ai-outreach.types.ts
├── ai-sales-intelligence/           # AI sales intelligence (12 modules)
│   ├── ai-insight-generator.ts
│   ├── competitor-analysis-engine.ts
│   ├── conversion-predictor.ts
│   ├── digital-marketing-opportunity-engine.ts
│   ├── lead-score-engine.ts
│   ├── opportunity-classifier.ts
│   ├── redesign-potential-engine.ts
│   ├── revenue-predictor.ts
│   ├── sales-intelligence-engine.ts
│   ├── sales-priority-engine.ts
│   ├── seo-opportunity-engine.ts
│   └── types.ts
├── ai-validation/                   # AI validation pipeline (8 modules)
│   ├── ai-relevance.service.ts
│   ├── business-classifier.ts
│   ├── confidence-engine.ts
│   ├── keyword-intelligence.ts
│   ├── lead-quality-engine.ts
│   ├── location-validator.ts
│   ├── rejection-engine.ts
│   └── semantic-validator.ts
├── automation/                      # Area Automation pipeline (7 files)
│   ├── area-automation-engine.ts    # Orchestrator: start/stop/resume/getProgress
│   ├── area-automation-queue.ts     # Per-session sequential queue
│   ├── area-automation.model.ts     # Mongoose schemas (session UUID, job ObjectId)
│   ├── area-automation.types.ts     # Shared DTO types
│   ├── area-iterator.ts             # City/area pair iteration
│   ├── automation.service.ts        # Legacy automation
│   └── workflow-manager.ts          # Workflow orchestration
├── browser/                         # Playwright browser management
│   ├── browser-manager.ts
│   ├── browser-pool.ts
│   ├── page-manager.ts
│   └── index.ts
├── business-intelligence/           # BI engine (10 modules)
│   ├── business-intelligence-engine.ts
│   ├── trust-score-engine.ts
│   ├── website-quality-engine.ts
│   ├── opportunity-engine.ts
│   ├── social-detector.ts
│   ├── contact-detector.ts
│   ├── freshness-detector.ts
│   ├── footer-analyzer.ts
│   ├── ai-recommendation-engine.ts
│   └── types.ts
├── config/
│   ├── database.ts                  # MongoDB connection with retry
│   └── location-data.ts             # India states/cities/areas
├── constants/
│   ├── analysis.ts
│   └── index.ts
├── controllers/                     # 20 Express route handlers
│   ├── analytics.controller.ts
│   ├── area-automation.controller.ts
│   ├── auth.controller.ts
│   ├── automation.controller.ts
│   ├── business-intelligence.controller.ts
│   ├── contact-extractor.controller.ts
│   ├── crm.controller.ts
│   ├── exporter.controller.ts
│   ├── lead-filters.controller.ts
│   ├── lead.controller.ts
│   ├── mega-ai.controller.ts
│   ├── outreach.controller.ts
│   ├── responsive-audit.controller.ts
│   ├── sales-intelligence.controller.ts
│   ├── scraper.controller.ts
│   ├── search-analytics.controller.ts
│   ├── semantic-search.controller.ts
│   ├── source.controller.ts
│   ├── website-intelligence.controller.ts
│   └── whatsapp-automation.controller.ts
├── core/
│   ├── browser/
│   │   ├── browser-manager.ts
│   │   ├── chrome-profile.ts
│   │   └── index.ts
│   └── scraper-engine/              # Core scraper engine
│       ├── area-queue.ts
│       ├── browser-manager.ts
│       ├── lead-normalizer.ts
│       ├── lead-storage.ts
│       ├── retry-engine.ts
│       ├── scraper-engine.ts
│       ├── types.ts
│       ├── logs/scraper-logger.ts
│       └── sources/
│           ├── googleMaps/scraper.ts
│           ├── indiamart/scraper.ts
│           └── justdial/scraper.ts
├── crm/
│   ├── models/CrmActivity.ts
│   ├── models/CrmFollowUp.ts
│   ├── models/CrmNote.ts
│   └── types/index.ts
├── exporters/
│   ├── csv.exporter.ts
│   ├── excel.exporter.ts
│   └── index.ts
├── jobs/                            # Background jobs
│   ├── contact-extraction.job.ts
│   ├── export-generation.job.ts
│   ├── lead-generation.job.ts
│   └── website-analysis.job.ts
├── mega-ai-engine/
│   ├── index.ts
│   └── mega-ai-orchestrator.ts
├── middlewares/                     # 9 middlewares
│   ├── index.ts
│   ├── async-handler.ts
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── not-found.middleware.ts
│   ├── request-logger.ts
│   ├── timeout.middleware.ts
│   ├── validate-objectid.middleware.ts
│   └── validation.middleware.ts
├── migrations/
│   ├── fix-lead-websites.ts
│   └── v2-fix-all-website-classifications.ts
├── models/                          # 6 Mongoose schemas
│   ├── Lead.ts, User.ts, Automation.ts
│   ├── SearchHistory.ts
│   ├── SearchAnalytics.ts
│   └── EmailScanCache.ts
├── modules/
│   ├── automation-monitor/          # Real-time execution monitoring
│   │   ├── execution-log.model.ts
│   │   ├── monitor-engine.ts
│   │   ├── monitor.controller.ts
│   │   ├── monitor.routes.ts
│   │   ├── monitor.types.ts
│   │   └── socket-manager.ts
│   ├── leads/services/
│   │   ├── leadFilter.service.ts
│   │   └── urlClassifier.service.ts
│   ├── reports/                     # A4 report generation
│   │   ├── report.controller.ts
│   │   ├── report.generator.ts
│   │   ├── report.pdf.ts
│   │   ├── report.queue.ts
│   │   ├── report.routes.ts
│   │   ├── report.service.ts
│   │   ├── report.storage.ts
│   │   ├── report.template.ts
│   │   └── report.types.ts
│   ├── scrapers/indiamart/          # IndiaMart scraper module
│   │   ├── indiamart.extractor.ts
│   │   ├── indiamart.normalizer.ts
│   │   ├── indiamart.parser.ts
│   │   ├── indiamart.profile.ts
│   │   ├── indiamart.queue.ts
│   │   ├── indiamart.scraper.ts
│   │   ├── indiamart.types.ts
│   │   └── indiamart.validator.ts
│   └── search/
│       └── businessCategoryEngine.ts
├── monitoring/
│   ├── metrics.service.ts
│   ├── scraper-monitor.ts
│   └── index.ts
├── recovery/
│   ├── crash-recovery.ts
│   ├── retry-handler.ts
│   ├── timeout-handler.ts
│   └── index.ts
├── routes/                          # 25 route modules
│   ├── index.ts                     # Aggregator: all under /api/v1
│   ├── auth.route.ts
│   ├── leads.route.ts
│   ├── area-automation.route.ts
│   ├── analytics.route.ts
│   ├── search.route.ts
│   ├── search-analytics.route.ts
│   ├── semantic-search.route.ts
│   ├── export.route.ts
│   ├── scraper.route.ts
│   ├── source.route.ts
│   ├── crm.route.ts
│   ├── automation.route.ts
│   ├── contact-extraction.route.ts
│   ├── business-intelligence.route.ts
│   ├── sales-intelligence.route.ts
│   ├── outreach.route.ts
│   ├── responsive-audit.route.ts
│   ├── mega-ai.route.ts
│   ├── lead-filters.route.ts
│   ├── website-intelligence.route.ts
│   ├── whatsapp-automation.route.ts
│   ├── email-discovery.route.ts
│   ├── migration.route.ts
│   ├── whatsapp-ai-bridge.route.ts
│   ├── whatsapp.route.ts
│   └── health.route.ts
├── scraper-core/
│   ├── scraper-manager.ts
│   ├── scraper-session.ts
│   ├── scraper-worker.ts
│   └── index.ts
├── scrapers/
│   ├── browser-manager.ts
│   ├── google-maps.scraper.ts
│   └── index.ts
├── schedulers/
│   └── cron.scheduler.ts
├── scripts/
│   └── cleanup-category-ratings.ts
├── services/                        # 48 business logic services
│   ├── auth.service.ts
│   ├── scraper.service.ts
│   ├── crm.service.ts
│   ├── lead.service.ts
│   ├── analytics.service.ts
│   ├── ai-analysis.service.ts
│   ├── ai-pipeline.service.ts
│   ├── ai-processing-queue.service.ts
│   ├── audit-cache.service.ts
│   ├── audit-concurrency.service.ts
│   ├── browser-pool.service.ts
│   ├── business-email-discovery.service.ts
│   ├── business-intelligence.service.ts
│   ├── business-relevance-validator.ts
│   ├── cache.service.ts
│   ├── contact-extractor.service.ts
│   ├── contact-page-detector.service.ts
│   ├── dedup-engine.ts
│   ├── deduplication.service.ts
│   ├── email-discovery-queue.service.ts
│   ├── lead-audit-processor.service.ts
│   ├── lead-audit-trigger.service.ts
│   ├── lead-migration.service.ts
│   ├── lead-qualification.service.ts
│   ├── mega-ai.service.ts
│   ├── normalization.service.ts
│   ├── outreach.service.ts
│   ├── owner-detector.service.ts
│   ├── performance-profiler.service.ts
│   ├── responsive-audit.service.ts
│   ├── responsive-audit-queue.service.ts
│   ├── sales-intelligence.service.ts
│   ├── scraping-progress.ts
│   ├── search-coverage.service.ts
│   ├── search-query-builder.ts
│   ├── search-query-scheduler.service.ts
│   ├── search-status.service.ts
│   ├── semantic-search.service.ts
│   ├── social-extractor.service.ts
│   ├── website-analysis.service.ts
│   ├── website-analyzer.service.ts
│   ├── website-classification.service.ts
│   ├── website-crawler.service.ts
│   ├── website-detection.service.ts
│   ├── website-intelligence.service.ts
│   ├── whatsapp-ai.service.ts
│   └── whatsapp-message.service.ts
├── source-core/
│   ├── base-source.ts
│   ├── lead-data.ts
│   ├── scraping-result.ts
│   ├── source-config.ts
│   └── index.ts
├── source-manager/
│   ├── source-manager.ts
│   └── index.ts
├── sources/                         # 4 source implementations
│   ├── google-maps/ (scraper.ts, selectors.ts)
│   ├── justdial/ (scraper.ts, selectors.ts, parser.ts, mapper.ts)
│   ├── indiamart/ (scraper.ts, selectors.ts)
│   └── clutch/ (scraper.ts, selectors.ts)
├── types/
│   ├── analysis.types.ts
│   ├── auth.d.ts
│   ├── global.d.ts
│   ├── index.ts
│   ├── qualification.types.ts
│   └── scraper.types.ts
├── uiux-intelligence/               # UI/UX intelligence
│   ├── layout-break-detector.ts
│   ├── responsive-engine.ts
│   ├── responsive-score-engine.ts
│   ├── screenshot-engine.ts
│   ├── uiux-analyzer.ts
│   ├── types.ts
│   └── viewport-checker.ts
├── utils/                           # 18 utility modules
│   ├── analytics-engine.ts
│   ├── api-error.ts
│   ├── api-response.ts
│   ├── auth-utils.ts
│   ├── contact-extraction.ts
│   ├── crawl-engine.ts
│   ├── dedup-engine.ts
│   ├── email-extract.ts
│   ├── error-handler.ts
│   ├── http-client.ts
│   ├── logger.ts
│   ├── pagination.ts
│   ├── quality-engine.ts
│   ├── urlClassifier.ts
│   ├── validations.ts
│   ├── verify-engine.ts
│   └── websiteClassifier.ts
└── validators/
    ├── index.ts
    ├── pagination.validator.ts
    └── search.validator.ts
```

### AI Service
```
ai-service/
├── main.py                          # FastAPI entry: app, CORS, routers, graceful shutdown
├── requirements.txt
├── .env.example
├── logs/                            # Analysis log files
└── app/
    ├── config/
    │   └── settings.py              # Pydantic Settings (host, port, mongodb_uri, timeout)
    ├── core/
    │   ├── middleware.py
    │   └── exception_handlers.py
    ├── models/
    │   ├── request_models.py        # Pydantic request schemas
    │   └── response_models.py       # Pydantic response schemas
    ├── routes/
    │   ├── health.py                # GET /health
    │   ├── analysis.py              # POST /analyze-lead, /analyze-bulk
    │   └── whatsapp.py              # WhatsApp campaign routes
    ├── services/
    │   ├── website_analysis_engine.py
    │   ├── scoring_engine.py
    │   ├── qualification_engine.py
    │   ├── summary_engine.py
    │   ├── business_opportunity_engine.py
    │   └── whatsapp/                # WhatsApp automation service
    │       ├── api.py
    │       ├── campaign_engine.py
    │       ├── config.py
    │       ├── database.py
    │       ├── engine.py
    │       ├── lead_loader.py
    │       ├── logs.py
    │       ├── message_builder.py
    │       ├── phone_utils.py
    │       ├── queue.py
    │       ├── sender.py
    │       ├── session.py
    │       └── template_engine.py
    └── utils/
        ├── logger.py                # loguru setup
        ├── constants.py
        ├── validators.py
        └── scoring_helpers.py
```

## Environment Variables

### Backend (`.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/lead-finder
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=<bcrypt hash>
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME="Lead Finder Agent"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

All endpoints under `/api/v1` except `/health` and `/auth/*` require JWT authentication.

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Admin login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| PATCH | `/api/v1/auth/change-password` | Change password |

### Leads
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/leads` | List leads (paginated, filterable) |
| GET | `/api/v1/leads/:id` | Get single lead |
| PATCH | `/api/v1/leads/:id` | Update lead |
| DELETE | `/api/v1/leads/:id` | Delete lead |
| GET | `/api/v1/leads/filters` | Lead filter options |

### Area Automation
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/area-automation/start` | Start automation session |
| GET | `/api/v1/area-automation/sessions` | List recent sessions |
| GET | `/api/v1/area-automation/sessions/:id` | Get session progress |
| GET | `/api/v1/area-automation/sessions/:id/jobs` | Get session jobs |
| POST | `/api/v1/area-automation/sessions/:id/stop` | Stop session |
| POST | `/api/v1/area-automation/sessions/:id/resume` | Resume session |
| GET | `/api/v1/area-automation/locations` | Get states/cities/areas |

### Search
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/search` | Search leads |
| POST | `/api/v1/semantic-search` | Semantic/AI search |
| POST | `/api/v1/extract-contact` | Extract contact from URL |

### Contact Extraction
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/contact-extraction` | Extract contacts from URLs |

### Export
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/export` | Export leads (CSV/Excel) |

### CRM
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/crm` | CRM pipeline operations |
| GET/POST | `/api/v1/crm/activities` | CRM activities |
| GET/POST | `/api/v1/crm/followups` | CRM follow-ups |
| GET/POST | `/api/v1/crm/notes` | CRM notes |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics` | Analytics data |

### Scraper / Sources
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/scraper` | Scraper management |
| GET | `/api/v1/sources` | Source management |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/reports` | List generated reports |
| POST | `/api/v1/reports/generate` | Generate report for a lead |
| GET | `/api/v1/reports/:id` | Get report details |
| GET | `/api/v1/reports/:id/html` | Get HTML report content |
| GET | `/api/v1/reports/:id/pdf` | Download PDF report |
| GET | `/api/v1/reports/:id/preview` | Get report preview data |

### Automation Monitor
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/automation-monitor` | Get execution logs |
| GET | `/api/v1/automation-monitor/:id` | Get log details |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/automation` | Legacy automation |
| POST | `/api/v1/business-intelligence` | Business intelligence analysis |
| POST | `/api/v1/sales-intelligence` | Sales intelligence analysis |
| POST | `/api/v1/outreach` | Outreach campaigns |
| POST | `/api/v1/responsive-audit` | Website responsive audit |
| POST | `/api/v1/mega-ai` | Mega AI orchestration |
| POST | `/api/v1/whatsapp-automation` | WhatsApp automation |
| GET | `/api/v1/lead-filters` | Lead filter configurations |

## Deep Dive

### Area Automation
Automatically scrape leads across cities and areas for multiple business types. The pipeline:
1. Creates a session with UUID `_id` and individual area-level jobs
2. Processes jobs sequentially (one at a time per session)
3. Supports stop/resume — stopped sessions can be resumed later
4. Polls real-time progress via React Query (1.5s progress, 2s jobs, 5s sessions)
5. Supports multiple concurrent sessions with independent tracking via Set/Map

### Auth Persistence
- JWT stored in `localStorage` and Zustand store
- User data persists across page refreshes via `localStorage`
- Hydrated on mount before rendering user-facing UI via AuthHydrator
- Admin account auto-seeded via `authService.ensureAdmin()`

### Lead Pipeline
- CRM-style pipeline stages (new-lead → contacted → interested → deal-won/lost)
- Source tracking with extraction metadata (Google Maps, Justdial, IndiaMart, Clutch)
- Validation status and confidence scoring
- Contact extraction from websites
- Deduplication engine with fuzzy matching

### Business Intelligence
- Website quality analysis and trust scoring
- Social presence detection (LinkedIn, Facebook, Twitter, Instagram)
- Business opportunity scoring
- Freshness detection (last updated, content age)
- Footer analysis for tech stack detection
- AI-powered recommendations

### AI Sales Intelligence
- Lead scoring with ML-based prediction
- Conversion probability estimation
- Revenue forecasting
- Competitor analysis
- SEO opportunity detection
- Redesign potential analysis
- Digital marketing opportunity scoring
- Sales priority ranking

### AI Outreach
- Cold email generation with personalization
- Proposal generation (generic, redesign, SEO)
- WhatsApp message crafting
- Follow-up sequence management
- Outreach history tracking
- Outreach scoring and reporting
- AI pitch generation

### AI Validation
- Business relevance validation
- Location validation against target areas
- Keyword intelligence for categorization
- Lead quality scoring
- Confidence engine for data reliability
- Semantic validation of business data
- Rejection engine for low-quality leads

### UI/UX Intelligence
- Layout break detection across viewports
- Responsive design scoring
- Screenshot engine for visual capture
- Viewport checker (mobile, tablet, desktop)
- UI/UX quality analysis

### WhatsApp Automation
- WhatsApp Web integration for messaging
- Automated outreach sequences
- Message template management
- Delivery tracking

### Lead Analysis (AI Service)
- Website crawling & deep analysis
- Lead scoring and qualification
- Business opportunity detection
- Summary generation
- Batch analysis support

### A4 Reports
Professional white-themed documentation for lead audits:
- A4 page size with proper margins (20mm)
- Clean white-based design with light gray borders
- Professional color scheme (Indigo accents #4F46E5, #7C3AED)
- Detailed sections: Responsive Audit, SEO Intelligence, Business Intelligence, AI Recommendations
- Report generation with progress tracking (HTML + PDF output)
- Exportable for sharing with stakeholders

Report sections include:
- Agency header with report ID and generation date
- Hero section with company details and audit/opportunity scores
- Profile card with contact information
- Responsive & UI/UX audit with detailed checks
- SEO intelligence analysis
- Business intelligence with opportunity assessment
- AI-powered recommendations and insights
- Outreach suggestions (email + WhatsApp templates)
- Footer with copyright and disclaimers

## Code Quality

```bash
npm run lint        # ESLint on both workspaces
npm run typecheck   # tsc --noEmit on both workspaces
```

## Documentation

- `AGENTS.md` — AI assistant context and conventions
- `PROJECT_STRUCTURE.md` — Directory layout reference
- `backend/src/modules/reports/` — Report generation module
