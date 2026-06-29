import { apiClient } from "@utils/api-client";
import {
  OverviewAnalytics,
  LeadAnalytics,
  ScrapingAnalytics,
  AutomationAnalytics,
  CategoryCount,
  LeadPerDay,
  DateRangeFilter,
  AnalyticsResponse,
  OverviewResponse,
  LeadAnalyticsResponse,
  ScrapingAnalyticsResponse,
  AutomationAnalyticsResponse,
} from "@/types/analytics";

export class AnalyticsService {
  /**
   * Get overview analytics
   */
  async getOverview(filter: DateRangeFilter = {}): Promise<OverviewResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<OverviewResponse>(`/analytics/overview?${params.toString()}`);
    return response;
  }

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(filter: DateRangeFilter = {}): Promise<LeadAnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<LeadAnalyticsResponse>(`/analytics/leads?${params.toString()}`);
    return response;
  }

  /**
   * Get scraping analytics
   */
  async getScrapingAnalytics(filter: DateRangeFilter = {}): Promise<ScrapingAnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<ScrapingAnalyticsResponse>(`/analytics/scraping?${params.toString()}`);
    return response;
  }

  /**
   * Get automation analytics
   */
  async getAutomationAnalytics(filter: DateRangeFilter = {}): Promise<AutomationAnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AutomationAnalyticsResponse>(`/analytics/automation?${params.toString()}`);
    return response;
  }

  /**
   * Get category distribution
   */
  async getCategoryDistribution(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/categories?${params.toString()}`);
    return response;
  }

  /**
   * Get leads per day
   */
  async getLeadsPerDay(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/leads-per-day?${params.toString()}`);
    return response;
  }

  /**
   * Get qualification distribution
   */
  async getQualificationDistribution(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/qualifications?${params.toString()}`);
    return response;
  }

  /**
   * Get website status distribution
   */
  async getWebsiteStatusDistribution(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/website-status?${params.toString()}`);
    return response;
  }

  /**
   * Get top locations
   */
  async getTopLocations(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/top-locations?${params.toString()}`);
    return response;
  }

  /**
   * Get highest scoring businesses
   */
  async getHighestScoringBusinesses(
    filter: DateRangeFilter = {},
    limit: number = 10
  ): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    params.append('limit', limit.toString());

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/highest-scored?${params.toString()}`);
    return response;
  }

  /**
   * Get area density data for heatmap
   */
  async getAreaDensity(filter: DateRangeFilter = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    return apiClient.get<AnalyticsResponse>(`/analytics/area-density?${params.toString()}`);
  }

  /**
   * Get top areas by lead count
   */
  async getTopAreas(filter: DateRangeFilter = {}, limit: number = 10): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    params.append('limit', limit.toString());
    return apiClient.get<AnalyticsResponse>(`/analytics/top-areas?${params.toString()}`);
  }

  /**
   * Get recent scraping history
   */
  async getRecentScrapingHistory(limit: number = 10): Promise<AnalyticsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await apiClient.get<AnalyticsResponse>(`/analytics/recent-scrapes?${params.toString()}`);
    return response;
  }
}

export const analyticsService = new AnalyticsService();
