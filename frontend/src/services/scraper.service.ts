import { apiClient } from "@utils/api-client";

export interface ScraperMetrics {
  activeSessions: number;
  totalScrapes: number;
  successfulScrapes: number;
  failedScrapes: number;
  averageScrapeTime: number;
  browserCrashes: number;
  retryCount: number;
  lastScrapeTime?: string;
}

export interface ScraperStatus {
  activeSessions: number;
  browserCount: number;
  queueLength: number;
  uptime: number;
}

export interface ScraperDetailedMetrics {
  summary: ScraperMetrics;
  successRate: number;
  failureRate: number;
  scrapeTimeDistribution: {
    fast: number;
    medium: number;
    slow: number;
  };
}

export interface ScraperResponse {
  success: boolean;
  message: string;
  data: any;
}

export class ScraperService {
  /**
   * Get scraper status
   */
  async getScraperStatus(): Promise<ScraperResponse> {
    const response = await apiClient.get<ScraperResponse>('/scraper/status');
    return response;
  }

  /**
   * Get scraper metrics
   */
  async getScraperMetrics(): Promise<ScraperResponse> {
    const response = await apiClient.get<ScraperResponse>('/scraper/metrics');
    return response;
  }

  /**
   * Restart scraper
   */
  async restartScraper(): Promise<ScraperResponse> {
    const response = await apiClient.post<ScraperResponse>('/scraper/restart');
    return response;
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<ScraperResponse> {
    const response = await apiClient.get<ScraperResponse>('/scraper/sessions');
    return response;
  }

  /**
   * Get real-time scraping progress by session ID
   */
  async getScrapingProgress(sessionId: string): Promise<ScrapingProgressResponse> {
    const response = await apiClient.get<ScrapingProgressResponse>(`/scraper/progress/${sessionId}`, {
      timeout: 5000,
    });
    return response;
  }

  async getSearchStatus(): Promise<SearchStatusResponse> {
    const response = await apiClient.get<SearchStatusResponse>('/semantic-search/status', {
      timeout: 5000,
    });
    return response;
  }
}

export interface SemanticQueryProgress {
  queryId: string;
  keyword: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  leadsFound: number;
  leadsStored: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
  retriesUsed: number;
}

export interface ScrapingProgressData {
  sessionId: string;
  keyword: string;
  location: string;
  area: string;
  city: string;
  state: string;
  businessType: string;
  status: 'running' | 'completed' | 'failed';
  totalFound: number;
  totalScraped: number;
  totalSaved: number;
  totalDuplicates: number;
  totalRejected: number;
  errors: string[];
  startedAt: string;
  updatedAt: string;
  semanticQueries?: SemanticQueryProgress[];
  totalSemanticQueries?: number;
  completedSemanticQueries?: number;
  failedSemanticQueries?: number;
  isPartialSuccess?: boolean;
}

export interface ScrapingProgressResponse {
  success: boolean;
  message: string;
  data: ScrapingProgressData;
}

export interface SearchStatusResponse {
  success: boolean;
  data: {
    activeSearch: boolean;
    scheduler: {
      activeCount: number;
      queueLength: number;
      concurrencyLimit: number;
    };
    browserPool: {
      poolSize: number;
      activeBrowsers: number;
      idleBrowsers: number;
    };
  };
}

export const scraperService = new ScraperService();
