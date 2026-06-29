# Lead Finder Agent — Project Structure

## Overview

Monorepo with three active workspaces: **frontend** (Next.js 15), **backend** (Express + TypeScript), and **ai-service** (Python FastAPI).

```
lead-finder-agent/
├── frontend/              # Next.js 15 App Router (port 3000)
├── backend/               # Express.js + TypeScript API (port 5000)
├── ai-service/            # Python FastAPI (port 8000)
├── Agent/                 # Skeletal workspace (incomplete)
├── Data/                  # Exports, backups, generated reports
├── Images of the Project/ # Screenshots for documentation
├── uploads/               # Uploaded report files
├── package.json           # Root workspace config (npm workspaces)
├── README.md              # Project overview
├── PROJECT_STRUCTURE.md   # This file
├── AGENTS.md              # AI assistant context
├── Business_Type_List.txt # Business categories
├── Logic.txt              # Architecture logic
├── MongoDB_Commands.md    # MongoDB CLI reference
└── .gitignore
```

---

## Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── middleware.ts                    # Route protection (redirects to /login)
│   ├── app/
│   │   ├── globals.css                  # Tailwind imports + global styles
│   │   ├── layout.tsx                   # Root layout (Inter font + Providers)
│   │   ├── providers.tsx                # QueryClient + Sonner Toaster + Devtools
│   │   ├── index.ts
│   │   ├── login/
│   │   │   └── page.tsx                 # Admin login page
│   │   └── (dashboard)/
│   │       ├── layout.tsx               # Dashboard shell (Sidebar + Header + AuthHydrator)
│   │       ├── page.tsx                 # Dashboard home (stats, features)
│   │       ├── analytics/page.tsx       # Analytics dashboard
│   │       ├── automation/
│   │       │   ├── page.tsx             # Area Automation UI
│   │       │   └── [id]/monitor/
│   │       │       └── page.tsx         # Automation execution monitor
│   │       ├── crm/page.tsx             # CRM pipeline board
│   │       ├── leads/page.tsx           # Lead list with filters
│   │       ├── logic-module/page.tsx    # Logic module configuration
│   │       ├── search/
│   │       │   ├── page.tsx             # Business search
│   │       │   └── history/page.tsx     # Search history
│   │       ├── settings/page.tsx        # Settings
│   │       └── whatsapp-automation/page.tsx  # WhatsApp automation UI
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── AreaHeatmap.tsx          # Geographic heatmap
│   │   │   ├── ResponsiveAuditStats.tsx # Responsive audit statistics
│   │   │   └── TopAreasChart.tsx        # Top areas chart
│   │   ├── auth/
│   │   │   └── AuthHydrator.tsx         # Restore auth state on mount
│   │   ├── automation/                  # 9 components
│   │   │   ├── AutomationActionsDropdown.tsx
│   │   │   ├── AutomationCreateModal.tsx
│   │   │   ├── AutomationDeleteModal.tsx
│   │   │   ├── AutomationEmptyState.tsx
│   │   │   ├── AutomationFilters.tsx
│   │   │   ├── AutomationProgress.tsx
│   │   │   ├── AutomationStats.tsx
│   │   │   ├── AutomationTable.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx              # App sidebar navigation
│   │   │   └── Header.tsx               # Top header bar
│   │   ├── leads/                       # 9 components
│   │   │   ├── audit-actions.tsx
│   │   │   ├── audit-status-badge.tsx
│   │   │   ├── lead-card.tsx
│   │   │   ├── lead-details-dialog.tsx
│   │   │   ├── lead-grid.tsx
│   │   │   ├── lead-list.tsx
│   │   │   ├── lead-social-icons.tsx
│   │   │   ├── responsive-audit-badge.tsx
│   │   │   └── responsive-audit-detail.tsx
│   │   ├── location/
│   │   │   └── cascading-location-select.tsx  # State/City/Area cascading selector
│   │   ├── logic-module/                # 6 visualization components
│   │   │   ├── AnimatedPipeline.tsx
│   │   │   ├── ArchitectureGraph.tsx
│   │   │   ├── EngineSection.tsx
│   │   │   ├── LogicCard.tsx
│   │   │   ├── LogicFlow.tsx
│   │   │   └── ScoreMeter.tsx
│   │   ├── search/
│   │   │   ├── lead-location-summary.tsx
│   │   │   └── search-history.tsx
│   │   └── ui/                          # 17 ShadCN UI primitives
│   │       ├── alert.tsx, avatar.tsx, badge.tsx, button.tsx
│   │       ├── card.tsx, checkbox.tsx, cn.tsx, dialog.tsx
│   │       ├── dropdown-menu.tsx, input.tsx, label.tsx
│   │       ├── pagination.tsx, searchable-select.tsx
│   │       ├── select.tsx, separator.tsx, table.tsx, tabs.tsx
│   ├── config/                          # 5 location config files
│   │   ├── city-coordinates.ts
│   │   ├── india-states.ts
│   │   ├── location-data.ts
│   │   ├── location-types.ts
│   │   └── index.ts
│   ├── data/
│   │   └── logicModuleData.ts           # Logic module static data
│   ├── hooks/                           # 20 React Query hooks
│   │   ├── useAnalytics.ts
│   │   ├── useAreaAutomation.ts
│   │   ├── useAutomationMonitor.ts
│   │   ├── useBusinessIntelligence.ts
│   │   ├── useDashboard.ts
│   │   ├── useLeadAuditTrigger.ts
│   │   ├── useLeadFilters.ts
│   │   ├── useLeads.ts
│   │   ├── useMegaAI.ts
│   │   ├── useOutreach.ts
│   │   ├── useProtectedRoute.ts
│   │   ├── useReport.ts
│   │   ├── useResponsiveAudit.ts
│   │   ├── useSalesIntelligence.ts
│   │   ├── useSearchSocket.ts
│   │   ├── useTheme.ts
│   │   ├── useWebsiteIntelligence.ts
│   │   ├── useWhatsAppAutomation.ts
│   │   └── useWhatsAppCampaign.ts
│   ├── lib/
│   │   ├── index.ts
│   │   └── utils.ts                     # General utility functions
│   ├── services/                        # 20 API client modules
│   │   ├── analytics.service.ts
│   │   ├── area-automation.service.ts
│   │   ├── auth.service.ts
│   │   ├── automation-monitor.service.ts
│   │   ├── automation.service.ts
│   │   ├── business-intelligence.service.ts
│   │   ├── crm.service.ts
│   │   ├── lead.service.ts
│   │   ├── mega-ai.service.ts
│   │   ├── outreach.service.ts
│   │   ├── report.service.ts
│   │   ├── responsive-audit.service.ts
│   │   ├── sales-intelligence.service.ts
│   │   ├── scraper.service.ts
│   │   ├── search-status.service.ts
│   │   ├── website-classification.service.ts
│   │   ├── website-intelligence.service.ts
│   │   ├── whatsapp-automation.service.ts
│   │   └── whatsapp-campaign.service.ts
│   ├── store/                           # 7 Zustand stores
│   │   ├── useAnalyticsStore.ts
│   │   ├── useAuthStore.ts
│   │   ├── useCRMStore.ts
│   │   ├── useLeadFilterStore.ts
│   │   ├── useLeadStore.ts
│   │   ├── useSearchAlertStore.ts
│   │   └── useSearchStore.ts
│   ├── types/
│   │   ├── analytics.ts
│   │   ├── index.ts
│   │   └── responsive-audit.types.ts
│   └── utils/                           # 8 utility modules
│       ├── api-client.ts                # Axios instance with auth interceptor
│       ├── api.ts                       # Legacy API utility
│       ├── auth-persistence.ts          # localStorage auth persistence
│       ├── cn.ts                        # Classname merge utility
│       ├── formatter.ts                 # Display formatters
│       ├── index.ts
│       ├── logger.ts                    # Frontend logger
│       └── socket-client.ts             # Socket.io client
├── .env.local                           # Frontend environment
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind CSS configuration
├── postcss.config.mjs                   # PostCSS configuration
├── tsconfig.json                        # TypeScript configuration
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

## Backend (`backend/`)

```
backend/
├── src/
│   ├── app.ts                           # Express entry point
│   ├── seed.ts                          # Database seeding script
│   │
│   ├── ai-outreach/                     # AI-powered outreach (12 modules)
│   │   ├── index.ts
│   │   ├── ai-outreach.types.ts
│   │   ├── ai-pitch-generator.ts
│   │   ├── cold-email-engine.ts
│   │   ├── followup-sequence-engine.ts
│   │   ├── outreach-history.service.ts
│   │   ├── outreach-report-generator.ts
│   │   ├── outreach-score-engine.ts
│   │   ├── personalization-engine.ts
│   │   ├── proposal-generator.ts
│   │   ├── redesign-proposal-engine.ts
│   │   ├── seo-proposal-engine.ts
│   │   └── whatsapp-message-engine.ts
│   │
│   ├── ai-sales-intelligence/           # AI sales intelligence (12 modules)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── ai-insight-generator.ts
│   │   ├── competitor-analysis-engine.ts
│   │   ├── conversion-predictor.ts
│   │   ├── digital-marketing-opportunity-engine.ts
│   │   ├── lead-score-engine.ts
│   │   ├── opportunity-classifier.ts
│   │   ├── redesign-potential-engine.ts
│   │   ├── revenue-predictor.ts
│   │   ├── sales-intelligence-engine.ts
│   │   ├── sales-priority-engine.ts
│   │   └── seo-opportunity-engine.ts
│   │
│   ├── ai-validation/                   # AI validation pipeline (8 modules)
│   │   ├── index.ts
│   │   ├── ai-relevance.service.ts
│   │   ├── business-classifier.ts
│   │   ├── confidence-engine.ts
│   │   ├── keyword-intelligence.ts
│   │   ├── lead-quality-engine.ts
│   │   ├── location-validator.ts
│   │   ├── rejection-engine.ts
│   │   └── semantic-validator.ts
│   │
│   ├── automation/                      # Area automation pipeline (7 files)
│   │   ├── area-automation-engine.ts    # Orchestrator (start/stop/resume)
│   │   ├── area-automation-queue.ts     # Per-session sequential queue
│   │   ├── area-automation.model.ts     # Mongoose schemas
│   │   ├── area-automation.types.ts     # DTO types
│   │   ├── area-iterator.ts             # City/area pair iterator
│   │   ├── automation.service.ts        # Legacy automation
│   │   └── workflow-manager.ts          # Workflow orchestration
│   │
│   ├── browser/                         # Playwright browser management
│   │   ├── index.ts
│   │   ├── browser-manager.ts
│   │   ├── browser-pool.ts
│   │   └── page-manager.ts
│   │
│   ├── business-intelligence/           # Business intelligence (10 modules)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── ai-recommendation-engine.ts
│   │   ├── business-intelligence-engine.ts
│   │   ├── contact-detector.ts
│   │   ├── footer-analyzer.ts
│   │   ├── freshness-detector.ts
│   │   ├── opportunity-engine.ts
│   │   ├── social-detector.ts
│   │   ├── trust-score-engine.ts
│   │   └── website-quality-engine.ts
│   │
│   ├── config/
│   │   ├── database.ts                  # MongoDB connection with retry
│   │   └── location-data.ts             # India states/cities/areas
│   │
│   ├── constants/
│   │   ├── index.ts
│   │   └── analysis.ts                  # Analysis constants
│   │
│   ├── controllers/                     # 20 Express route handlers
│   │   ├── analytics.controller.ts
│   │   ├── area-automation.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── automation.controller.ts
│   │   ├── business-intelligence.controller.ts
│   │   ├── contact-extractor.controller.ts
│   │   ├── crm.controller.ts
│   │   ├── exporter.controller.ts
│   │   ├── lead-filters.controller.ts
│   │   ├── lead.controller.ts
│   │   ├── mega-ai.controller.ts
│   │   ├── outreach.controller.ts
│   │   ├── responsive-audit.controller.ts
│   │   ├── sales-intelligence.controller.ts
│   │   ├── scraper.controller.ts
│   │   ├── search-analytics.controller.ts
│   │   ├── semantic-search.controller.ts
│   │   ├── source.controller.ts
│   │   ├── website-intelligence.controller.ts
│   │   └── whatsapp-automation.controller.ts
│   │
│   ├── core/
│   │   ├── browser/
│   │   │   ├── index.ts
│   │   │   ├── browser-manager.ts       # Core browser management
│   │   │   └── chrome-profile.ts        # Chrome profile handling
│   │   └── scraper-engine/              # Core scraping engine
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── area-queue.ts
│   │       ├── browser-manager.ts
│   │       ├── lead-normalizer.ts
│   │       ├── lead-storage.ts
│   │       ├── retry-engine.ts
│   │       ├── scraper-engine.ts
│   │       ├── logs/
│   │       │   └── scraper-logger.ts
│   │       └── sources/
│   │           ├── googleMaps/scraper.ts
│   │           ├── indiamart/scraper.ts
│   │           └── justdial/scraper.ts
│   │
│   ├── crm/                             # CRM subsystem
│   │   ├── models/
│   │   │   ├── CrmActivity.ts
│   │   │   ├── CrmFollowUp.ts
│   │   │   └── CrmNote.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── exporters/
│   │   ├── index.ts
│   │   ├── csv.exporter.ts
│   │   └── excel.exporter.ts
│   │
│   ├── jobs/                            # Background jobs
│   │   ├── index.ts
│   │   ├── contact-extraction.job.ts
│   │   ├── export-generation.job.ts
│   │   ├── lead-generation.job.ts
│   │   └── website-analysis.job.ts
│   │
│   ├── mega-ai-engine/                  # Mega AI orchestration
│   │   ├── index.ts
│   │   └── mega-ai-orchestrator.ts
│   │
│   ├── middlewares/                     # 9 middlewares
│   │   ├── index.ts
│   │   ├── async-handler.ts
│   │   ├── auth.middleware.ts           # JWT authentication
│   │   ├── error.middleware.ts          # Global error handler
│   │   ├── not-found.middleware.ts      # 404 handler
│   │   ├── request-logger.ts
│   │   ├── timeout.middleware.ts
│   │   ├── validate-objectid.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── migrations/
│   │   ├── fix-lead-websites.ts
│   │   └── v2-fix-all-website-classifications.ts
│   │
│   ├── models/                          # 6 Mongoose schemas
│   │   ├── index.ts
│   │   ├── Lead.ts                      # Main lead schema
│   │   ├── User.ts                      # Auth user schema
│   │   ├── Automation.ts                # Legacy automation schema
│   │   ├── SearchHistory.ts             # Search history tracking
│   │   ├── SearchAnalytics.ts           # Search analytics
│   │   └── EmailScanCache.ts            # Email scanning cache
│   │
│   ├── modules/
│   │   ├── automation-monitor/          # Real-time execution monitoring
│   │   │   ├── execution-log.model.ts
│   │   │   ├── monitor-engine.ts
│   │   │   ├── monitor.controller.ts
│   │   │   ├── monitor.routes.ts
│   │   │   ├── monitor.types.ts
│   │   │   └── socket-manager.ts
│   │   ├── leads/
│   │   │   └── services/
│   │   │       ├── leadFilter.service.ts
│   │   │       └── urlClassifier.service.ts
│   │   ├── reports/                     # A4 report generation
│   │   │   ├── report.controller.ts
│   │   │   ├── report.generator.ts
│   │   │   ├── report.pdf.ts
│   │   │   ├── report.queue.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── report.service.ts
│   │   │   ├── report.storage.ts
│   │   │   ├── report.template.ts
│   │   │   └── report.types.ts
│   │   ├── scrapers/indiamart/          # IndiaMart scraper module
│   │   │   ├── indiamart.extractor.ts
│   │   │   ├── indiamart.normalizer.ts
│   │   │   ├── indiamart.parser.ts
│   │   │   ├── indiamart.profile.ts
│   │   │   ├── indiamart.queue.ts
│   │   │   ├── indiamart.scraper.ts
│   │   │   ├── indiamart.types.ts
│   │   │   └── indiamart.validator.ts
│   │   └── search/
│   │       └── businessCategoryEngine.ts
│   │
│   ├── monitoring/
│   │   ├── index.ts
│   │   ├── metrics.service.ts
│   │   └── scraper-monitor.ts
│   │
│   ├── recovery/
│   │   ├── index.ts
│   │   ├── crash-recovery.ts
│   │   ├── retry-handler.ts
│   │   └── timeout-handler.ts
│   │
│   ├── routes/                          # 27 route modules
│   │   ├── index.ts                     # Route aggregator (/api/v1)
│   │   ├── analytics.route.ts
│   │   ├── area-automation.route.ts
│   │   ├── auth.route.ts
│   │   ├── automation.route.ts
│   │   ├── business-intelligence.route.ts
│   │   ├── contact-extraction.route.ts
│   │   ├── crm.route.ts
│   │   ├── email-discovery.route.ts
│   │   ├── export.route.ts
│   │   ├── health.route.ts
│   │   ├── lead-filters.route.ts
│   │   ├── leads.route.ts
│   │   ├── mega-ai.route.ts
│   │   ├── migration.route.ts
│   │   ├── outreach.route.ts
│   │   ├── responsive-audit.route.ts
│   │   ├── sales-intelligence.route.ts
│   │   ├── scraper.route.ts
│   │   ├── search.route.ts
│   │   ├── search-analytics.route.ts
│   │   ├── semantic-search.route.ts
│   │   ├── source.route.ts
│   │   ├── website-intelligence.route.ts
│   │   ├── whatsapp.route.ts
│   │   ├── whatsapp-ai-bridge.route.ts
│   │   └── whatsapp-automation.route.ts
│   │
│   ├── schedulers/
│   │   └── cron.scheduler.ts            # Cron job scheduling
│   │
│   ├── scraper-core/                    # Scraper infrastructure
│   │   ├── index.ts
│   │   ├── scraper-manager.ts
│   │   ├── scraper-session.ts
│   │   └── scraper-worker.ts
│   │
│   ├── scrapers/                        # Playwright-based scrapers
│   │   ├── index.ts
│   │   ├── browser-manager.ts
│   │   └── google-maps.scraper.ts
│   │
│   ├── scripts/
│   │   └── cleanup-category-ratings.ts
│   │
│   ├── services/                        # 48 business logic services
│   │   ├── index.ts
│   │   ├── ai-analysis.service.ts
│   │   ├── ai-pipeline.service.ts
│   │   ├── ai-processing-queue.service.ts
│   │   ├── analytics.service.ts
│   │   ├── audit-cache.service.ts
│   │   ├── audit-concurrency.service.ts
│   │   ├── auth.service.ts              # Auth + admin seeding
│   │   ├── browser-pool.service.ts
│   │   ├── business-email-discovery.service.ts
│   │   ├── business-intelligence.service.ts
│   │   ├── business-relevance-validator.ts
│   │   ├── cache.service.ts
│   │   ├── contact-extractor.service.ts
│   │   ├── contact-page-detector.service.ts
│   │   ├── crm.service.ts
│   │   ├── dedup-engine.ts
│   │   ├── deduplication.service.ts
│   │   ├── email-discovery-queue.service.ts
│   │   ├── lead-audit-processor.service.ts
│   │   ├── lead-audit-trigger.service.ts
│   │   ├── lead-migration.service.ts
│   │   ├── lead-qualification.service.ts
│   │   ├── lead.service.ts
│   │   ├── mega-ai.service.ts
│   │   ├── normalization.service.ts
│   │   ├── outreach.service.ts
│   │   ├── owner-detector.service.ts
│   │   ├── performance-profiler.service.ts
│   │   ├── responsive-audit.service.ts
│   │   ├── responsive-audit-queue.service.ts
│   │   ├── sales-intelligence.service.ts
│   │   ├── scraper.service.ts
│   │   ├── scraping-progress.ts
│   │   ├── search-coverage.service.ts
│   │   ├── search-query-builder.ts
│   │   ├── search-query-scheduler.service.ts
│   │   ├── search-status.service.ts
│   │   ├── semantic-search.service.ts
│   │   ├── social-extractor.service.ts
│   │   ├── website-analysis.service.ts
│   │   ├── website-analyzer.service.ts
│   │   ├── website-classification.service.ts
│   │   ├── website-crawler.service.ts
│   │   ├── website-detection.service.ts
│   │   ├── website-intelligence.service.ts
│   │   ├── whatsapp-ai.service.ts
│   │   └── whatsapp-message.service.ts
│   │
│   ├── source-core/                     # Source abstractions
│   │   ├── index.ts
│   │   ├── base-source.ts
│   │   ├── lead-data.ts
│   │   ├── scraping-result.ts
│   │   └── source-config.ts
│   │
│   ├── source-manager/                  # Source management
│   │   ├── index.ts
│   │   └── source-manager.ts
│   │
│   ├── sources/                         # 4 source implementations
│   │   ├── index.ts
│   │   ├── google-maps/
│   │   │   ├── index.ts
│   │   │   ├── scraper.ts
│   │   │   └── selectors.ts
│   │   ├── justdial/
│   │   │   ├── index.ts
│   │   │   ├── scraper.ts
│   │   │   ├── selectors.ts
│   │   │   ├── parser.ts
│   │   │   └── mapper.ts
│   │   ├── indiamart/
│   │   │   ├── index.ts
│   │   │   ├── scraper.ts
│   │   │   └── selectors.ts
│   │   └── clutch/
│   │       ├── index.ts
│   │       ├── scraper.ts
│   │       └── selectors.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── analysis.types.ts
│   │   ├── auth.d.ts
│   │   ├── global.d.ts
│   │   ├── qualification.types.ts
│   │   └── scraper.types.ts
│   │
│   ├── uiux-intelligence/               # UI/UX intelligence
│   │   ├── index.ts
│   │   ├── README.md
│   │   ├── types.ts
│   │   ├── layout-break-detector.ts
│   │   ├── responsive-engine.ts
│   │   ├── responsive-score-engine.ts
│   │   ├── screenshot-engine.ts
│   │   ├── uiux-analyzer.ts
│   │   └── viewport-checker.ts
│   │
│   ├── utils/                           # 18 utility modules
│   │   ├── index.ts
│   │   ├── analytics-engine.ts
│   │   ├── api-error.ts
│   │   ├── api-response.ts
│   │   ├── auth-utils.ts
│   │   ├── contact-extraction.ts
│   │   ├── crawl-engine.ts
│   │   ├── dedup-engine.ts
│   │   ├── email-extract.ts
│   │   ├── error-handler.ts
│   │   ├── http-client.ts
│   │   ├── logger.ts
│   │   ├── pagination.ts
│   │   ├── quality-engine.ts
│   │   ├── urlClassifier.ts
│   │   ├── validations.ts
│   │   ├── verify-engine.ts
│   │   └── websiteClassifier.ts
│   │
│   └── validators/                      # Zod validation schemas
│       ├── index.ts
│       ├── pagination.validator.ts
│       └── search.validator.ts
│
├── test-scrape*.{js,mjs,cjs,ts}          # Scraper test scripts
├── uploads/
│   └── reports/
│       ├── html/
│       ├── pdf/
│       └── screenshots/
├── data/
│   └── whatsapp-sessions/
│       └── whatsapp-auth.json            # WhatsApp Web auth data
├── leads_data.csv
├── .env.example
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── .env
├── package.json
└── README.md
```

---

## AI Service (`ai-service/`)

```
ai-service/
├── main.py                               # FastAPI entry point
├── requirements.txt                      # Python dependencies
├── .env.example                          # Environment template
├── README.md
├── logs/                                 # Analysis log files
└── app/
    ├── __init__.py
    ├── config/
    │   ├── __init__.py
    │   └── settings.py                   # Pydantic settings
    ├── core/
    │   ├── __init__.py
    │   ├── middleware.py                  # FastAPI middleware
    │   └── exception_handlers.py         # Error handlers
    ├── models/
    │   ├── __init__.py
    │   ├── request_models.py             # Pydantic request schemas
    │   └── response_models.py            # Pydantic response schemas
    ├── routes/
    │   ├── __init__.py
    │   ├── health.py                     # GET /health
    │   ├── analysis.py                   # POST /analyze-lead, /analyze-bulk
    │   └── whatsapp.py                   # WhatsApp campaign routes
    ├── services/
    │   ├── __init__.py
    │   ├── website_analysis_engine.py    # Website crawling & analysis
    │   ├── scoring_engine.py             # Lead scoring
    │   ├── qualification_engine.py       # Lead qualification
    │   ├── summary_engine.py             # Summary generation
    │   ├── business_opportunity_engine.py
    │   └── whatsapp/                     # WhatsApp automation service
    │       ├── __init__.py
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
        ├── __init__.py
        ├── logger.py                     # loguru setup
        ├── constants.py                  # Scoring constants
        ├── validators.py                 # Input validators
        └── scoring_helpers.py            # Scoring utilities
```

---

## Root Configuration

```
├── package.json                          # npm workspaces root
├── README.md                             # Project overview
├── PROJECT_STRUCTURE.md                  # This file
├── AGENTS.md                             # AI assistant context
├── Business_Type_List.txt                # Business categories
├── Logic.txt                             # Architecture logic
├── MongoDB_Commands.md                   # MongoDB CLI reference
├── BUGFIX_LEADS_PAGE_ERROR.md
├── Final_PRMT.txt
├── Issue to Fix.md
├── README_SEARCH_PROGRESS_FIX.md
├── .gitignore
└── .vscode/
    └── settings.json
```

---

## Conventions

### File Naming
- **Backend**: `{feature}.{type}.ts` (e.g., `area-automation.route.ts`, `auth.service.ts`)
- **Frontend**: PascalCase for components (`Sidebar.tsx`), camelCase for hooks/services (`useLeads.ts`)
- **Python**: snake_case throughout (`scoring_engine.py`)

### API Versioning
All routes are mounted under `/api/v1` via `routes/index.ts`.

### Module Pattern (Backend)
Each domain module lives in its own directory under `src/`:
```
domain/
├── index.ts            # Public exports
├── domain.types.ts     # Type definitions
├── domain.model.ts     # Mongoose schema
├── domain.service.ts   # Business logic
└── domain.controller.ts # Request handlers
```

### NPM Workspaces
```json
["backend", "frontend", "ai-service"]
```

### Key Statistics
| Workspace | Language | Entry Point | Source Files |
|-----------|----------|-------------|-------------|
| `backend/` | TypeScript + Express | `src/app.ts` | ~220+ `.ts` files |
| `frontend/` | TypeScript + Next.js 15 | `src/app/layout.tsx` | ~110+ `.tsx`/`.ts` files |
| `ai-service/` | Python + FastAPI | `main.py` | ~30+ `.py` files |
