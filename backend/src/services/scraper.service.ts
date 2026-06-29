import { scraperEngine } from '../core/scraper-engine/scraper-engine';
import { LeadData } from '../source-core/base-source';
import type { SourceQuery } from './search-query-builder';
import { logger } from '../utils/logger';

export const DEFAULT_SEARCH_SOURCES = ['google-maps', 'justdial', 'indiamart'] as const;

export interface ScrapeOptions {
  keyword: string;
  location?: string;
  sources?: string[];
  limit: number;
  state?: string;
  city?: string;
  area?: string;
  country?: string;
  businessType?: string;
  sessionId?: string;
  skipSearchTracking?: boolean;
  isCancelled?: () => boolean;
  semanticExpansion?: boolean;
  maxResults?: number;
  resumeSessionId?: string;
}

export interface ScrapeResult {
  success: boolean;
  message: string;
  results: {
    [sourceName: string]: {
      totalExtracted: number;
      totalStored: number;
      totalDuplicates: number;
    };
  };
  totalExtracted: number;
  totalStored: number;
  totalDuplicates: number;
  leads: LeadData[];
  errors?: Array<{ source: string; keyword: string; error: string }>;
  sourceQueries?: SourceQuery[];
}

function toLeadData(lead: any): LeadData {
  return {
    id: lead.placeId || `${lead.companyName}-${Date.now()}`,
    companyName: lead.companyName,
    website: lead.website,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    category: lead.category,
    rating: lead.rating,
    reviewsCount: lead.reviewsCount,
    source: lead.source,
    sourceUrl: lead.sourceUrl,
    href: lead.href,
    placeId: lead.placeId,
    createdAt: new Date().toISOString(),
    area: lead.area,
    city: lead.city,
    state: lead.state,
    businessType: lead.businessType,
    fullSearchQuery: lead.fullSearchQuery,
    relevanceScore: lead.relevanceScore,
    validatedCategory: lead.validatedCategory,
    sources: lead.sources || [lead.source],
  };
}

export class ScraperService {
  async scrapeBusinesses(options: ScrapeOptions): Promise<ScrapeResult> {
    const { keyword, location, sources = [], limit = 1000, state, city, area, country, businessType, sessionId, skipSearchTracking, isCancelled, maxResults, resumeSessionId } = options;

    const searchQuery = `${businessType || keyword} in ${[area, city, state, country].filter(Boolean).join(' ')}`.trim();

    logger.info({
      action: 'search_started',
      keyword, area, city, state, country, sources, limit, sessionId,
      searchQuery, skipSearchTracking,
    }, `[SCRAPER_SERVICE] Starting scrape for "${keyword}" in ${[area, city, state, country].filter(Boolean).join(', ') || location}`);

    try {
      const result = await scraperEngine.scrapeMultiSource({
        keyword,
        location,
        sources: sources.length > 0 ? sources : [...DEFAULT_SEARCH_SOURCES],
        limit,
        state,
        city,
        area,
        country,
        businessType: businessType || keyword,
        sessionId,
        skipSearchTracking,
        isCancelled,
        maxResults: maxResults || options.maxResults,
        resumeSessionId: resumeSessionId || options.resumeSessionId,
      });

      const leads: LeadData[] = result.leads.map(toLeadData);

      const resultsMap: Record<string, { totalExtracted: number; totalStored: number; totalDuplicates: number }> = {};
      for (const sr of result.sourceResults) {
        resultsMap[sr.source] = {
          totalExtracted: sr.totalExtracted,
          totalStored: sr.totalStored,
          totalDuplicates: sr.totalDuplicates,
        };
      }

      logger.info({
        action: 'search_completed',
        totalExtracted: result.totalExtracted,
        totalStored: result.totalStored,
        totalDuplicates: result.totalDuplicates,
        sources: sources.length,
        keyword, area, city, state, country,
        success: result.success,
        errorCount: result.errors?.length || 0,
      }, `[SCRAPER_SERVICE] Scrape completed: ${result.message}`);

      if (result.errors && result.errors.length > 0) {
        for (const err of result.errors) {
          logger.error({ source: err.source, error: err.error }, `[SCRAPER_SERVICE] Source error: [${err.source}] ${err.error}`);
        }
      }

      return {
        success: result.success || result.totalStored > 0,
        message: result.message,
        results: resultsMap,
        totalExtracted: result.totalExtracted,
        totalStored: result.totalStored,
        totalDuplicates: result.totalDuplicates,
        leads,
        errors: result.errors ? result.errors.map(e => ({ source: e.source, keyword: e.keyword, error: e.error })) : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown scraping error';
      logger.error({
        action: 'search_failed',
        err: message, keyword, area, city, state, country,
      }, `[SCRAPER_SERVICE] ${'(╯°□°)╯︵ ┻━┻'} Scrape threw exception: ${message}`);
      return {
        success: false,
        message: `Scraper service error: ${message}`,
        results: {},
        totalExtracted: 0,
        totalStored: 0,
        totalDuplicates: 0,
        leads: [],
        errors: [{ source: 'scraper-service', keyword, error: message }],
      };
    }
  }
}

export const scraperService = new ScraperService();
