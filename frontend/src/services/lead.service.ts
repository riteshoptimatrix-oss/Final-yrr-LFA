import { apiClient } from "@utils/api-client";
import { Lead, SearchFilters, PaginatedLeadsResponse, SemanticExpansionInfo, FilterOptions, FilterCounts } from '@/types/index';

export interface LeadSearchResponse {
  success: boolean;
  message: string;
  count: number;
  leads?: Lead[];
  data: {
    leads: Lead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  semanticInfo?: SemanticExpansionInfo;
}

interface RawLeadSearchResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: Lead[] | {
    leads?: Lead[];
    pagination?: Partial<{
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>;
  };
  leads?: Lead[];
  pagination?: Partial<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>;
  meta?: Record<string, unknown>;
}

export interface LeadResponse {
  success: boolean;
  message: string;
  data: Lead | Lead[];
}

export interface AnalyzeResponse {
  success: boolean;
  message: string;
  data: Lead;
}

export interface BulkAnalyzeResponse {
  success: boolean;
  message: string;
  data: {
    totalAnalyzed: number;
    results: any[];
  };
}

export interface QualificationStats {
  totalLeads: number;
  qualifiedLeads: number;
  byStatus: Record<string, number>;
  byLevel: Record<string, number>;
  avgScore: number;
}

export interface QualificationStatsResponse {
  success: boolean;
  message: string;
  data: QualificationStats;
}

export interface QualifiedLeadsResponse {
  success: boolean;
  message: string;
  data: {
    leads: Lead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class LeadService {
  async searchLeads(filters: SearchFilters & { sessionId?: string }): Promise<LeadSearchResponse> {
    const response = await apiClient.post<RawLeadSearchResponse>(
      "/search",
      {
        keyword: filters.keyword,
        location: filters.location,
        state: filters.state,
        city: filters.city,
        area: filters.area,
        country: filters.country,
        businessType: filters.businessType || filters.keyword,
        sources: filters.sources || ['google-maps'],
        sessionId: filters.sessionId,
        semanticExpansion: filters.semanticExpansion !== false,
      },
      { timeout: 15000 }
    );
    return this.normalizeLeadSearchResponse(response);
  }

  async getLeads(params?: Record<string, string | undefined>): Promise<PaginatedLeadsResponse> {
    const queryParts: string[] = [];
    const filterParams = [
      'page', 'limit', 'search', 'keyword', 'location', 'country',
      'state', 'city', 'area', 'businessType', 'category', 'source',
      'hasWebsite', 'hasPhone', 'hasEmail', 'socialOnly', 'verifiedOnly',
      'hasWhatsApp', 'websiteType', 'status', 'quality',
      'confidence', 'minConfidence', 'maxConfidence',
      'validationStatus', 'qualificationLevel',
      'searchSessionId', 'enrichmentStatus',
      'sortField', 'sortOrder',
    ];

    for (const key of filterParams) {
      const val = params?.[key];
      if (val !== undefined && val !== '') {
        queryParts.push(`${key}=${encodeURIComponent(val)}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const response = await apiClient.get<PaginatedLeadsResponse>(`/leads${queryString}`, {
      timeout: 15000,
    });

    return response;
  }

  async getLeadById(id: string): Promise<LeadResponse> {
    const response = await apiClient.get<LeadResponse>(`/leads/${id}`);
    return response;
  }

  async createLead(data: Partial<Lead>): Promise<LeadResponse> {
    const response = await apiClient.post<LeadResponse>("/leads", data);
    return response;
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<LeadResponse> {
    const response = await apiClient.put<LeadResponse>(`/leads/${id}`, data);
    return response;
  }

  async deleteLead(id: string): Promise<LeadResponse> {
    const response = await apiClient.delete<LeadResponse>(`/leads/${id}`);
    return response;
  }

  async analyzeLead(id: string): Promise<AnalyzeResponse> {
    const response = await apiClient.post<AnalyzeResponse>(`/leads/${id}/analyze`, {
      leadId: id,
    });
    return response;
  }

  async bulkAnalyze(limit = 50): Promise<BulkAnalyzeResponse> {
    const response = await apiClient.post<BulkAnalyzeResponse>("/leads/bulk-analyze", {
      limit,
    });
    return response;
  }

  async getQualificationStats(): Promise<QualificationStatsResponse> {
    const response = await apiClient.get<QualificationStatsResponse>("/leads/stats");
    return response;
  }

  async getQualifiedLeads(options: {
    page?: number;
    limit?: number;
    qualificationLevel?: 'high-potential' | 'medium-potential' | 'low-potential';
    websiteStatus?: 'no-website' | 'broken-website' | 'outdated-website' | 'average-website' | 'modern-website';
    minLeadScore?: number;
    maxLeadScore?: number;
  } = {}): Promise<QualifiedLeadsResponse> {
    const { page = 1, limit = 10, qualificationLevel, websiteStatus, minLeadScore, maxLeadScore } = options;

    let url = `/leads/qualified?page=${page}&limit=${limit}`;

    if (qualificationLevel) url += `&qualificationLevel=${qualificationLevel}`;
    if (websiteStatus) url += `&websiteStatus=${websiteStatus}`;
    if (minLeadScore !== undefined) url += `&minLeadScore=${minLeadScore}`;
    if (maxLeadScore !== undefined) url += `&maxLeadScore=${maxLeadScore}`;

    const response = await apiClient.get<QualifiedLeadsResponse>(url);
    return response;
  }

  async requalifyUnanalyzed(limit = 50): Promise<BulkAnalyzeResponse> {
    const response = await apiClient.post<BulkAnalyzeResponse>("/leads/requalify", {
      limit,
    });
    return response;
  }

  async deleteAllLeads(): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> {
    const response = await apiClient.delete<{ success: boolean; message: string; data: { deletedCount: number } }>('/leads/delete-all');
    return response;
  }

  async getFilterOptions(filters?: { state?: string; city?: string; area?: string }): Promise<FilterOptions> {
    const params = new URLSearchParams();
    if (filters?.state) params.set('state', filters.state);
    if (filters?.city) params.set('city', filters.city);
    if (filters?.area) params.set('area', filters.area);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<{ success: boolean; data: FilterOptions }>(`/leads/filter-options${qs}`);
    return response.data;
  }

  async getFilterCounts(filters?: Record<string, string>): Promise<FilterCounts> {
    const params = new URLSearchParams();
    if (filters) {
      for (const [key, val] of Object.entries(filters)) {
        if (val) params.set(key, val);
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<{ success: boolean; data: FilterCounts }>(`/leads/filter-counts${qs}`);
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean; message: string; data: string[] }>('/leads/categories');
    return response?.data || [];
  }

  async exportCsv(options: Record<string, string> = {}): Promise<Blob> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value) params.append(key, value);
    }
    return await apiClient.getBlob('/export/csv', {
      params,
      headers: { 'Content-Type': 'text/csv' },
    });
  }

  async exportExcel(options: Record<string, string> = {}): Promise<Blob> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
      if (value) params.append(key, value);
    }
    return await apiClient.getBlob('/export/excel', {
      params,
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });
  }

  async downloadFile(blob: Blob, filename: string, mimeType: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.type = mimeType;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async analyzeLeadAI(id: string): Promise<LeadResponse> {
    const response = await apiClient.post<LeadResponse>(`/leads/${id}/analyze-ai`, { leadId: id });
    return response;
  }

  async bulkAnalyzeAI(limit = 50): Promise<BulkAnalyzeResponse> {
    const response = await apiClient.post<BulkAnalyzeResponse>("/leads/bulk-analyze-ai", { limit });
    return response;
  }

  async extractContacts(leadId: string): Promise<LeadResponse> {
    const response = await apiClient.post<LeadResponse>("/extract-contact", { leadId });
    return response;
  }

  async bulkExtractContacts(limit = 50): Promise<BulkAnalyzeResponse> {
    const response = await apiClient.post<BulkAnalyzeResponse>("/extract-contact/bulk", { limit });
    return response;
  }

  async searchBySources(request: {
    keyword: string;
    location?: string;
    sources: string[];
    limit?: number;
  }): Promise<LeadSearchResponse> {
    const response = await apiClient.post<RawLeadSearchResponse>(
      "/sources/search",
      request,
      { timeout: 180000 }
    );
    return this.normalizeLeadSearchResponse(response);
  }

  async getSources(): Promise<{ success: boolean; message: string; data: any[] }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: any[] }>("/sources");
    return response;
  }

  async triggerLeadAudits(leadId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      "/leads/audit/trigger",
      { leadId },
      { timeout: 60000 }
    );
    return response;
  }

  async triggerBulkAudits(leadIds: string[]): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.post<{ success: boolean; data: any[] }>(
      "/leads/audit/trigger-bulk",
      { leadIds },
      { timeout: 120000 }
    );
    return response;
  }

  async triggerAllMissingAudits(limit = 100): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      "/leads/audit/trigger-all",
      { limit },
      { timeout: 300000 }
    );
    return response;
  }

  async expandKeywords(keyword: string, sources?: string[], state?: string, city?: string, area?: string): Promise<SemanticExpansionInfo> {
    const locationState = state?.trim() || undefined;
    const locationCity = city?.trim() || undefined;
    const locationArea = area?.trim() || undefined;
    const response = await apiClient.post<{ success: boolean; data: SemanticExpansionInfo }>(
      "/semantic-search/expand",
      { keyword, sources: sources || ['google-maps'], state, city, area },
      { timeout: 10000 }
    );
    return response.data;
  }

  async discoverEmail(leadId: string): Promise<any> {
    const response = await apiClient.post(`/email-discovery/${leadId}`);
    return response.data;
  }

  async discoverEmailAsync(leadId: string): Promise<any> {
    const response = await apiClient.post(`/email-discovery/${leadId}?async=true`);
    return response.data;
  }

  async getEmailDiscoveryResult(leadId: string): Promise<any> {
    const response = await apiClient.get(`/email-discovery/${leadId}/result`);
    return response.data;
  }

  async backfillEmails(concurrency: number = 5): Promise<any> {
    const response = await apiClient.post('/email-discovery/backfill/start', { concurrency });
    return response.data;
  }

  async getEmailBackfillStatus(): Promise<any> {
    const response = await apiClient.get('/email-discovery/backfill/status');
    return response.data;
  }

  async getActiveSession(): Promise<any> {
    const response = await apiClient.get('/search/active-session');
    return response.data;
  }

  async getSearchHistory(page = 1, limit = 20): Promise<any> {
    const response = await apiClient.get(`/search/history/aggregated?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getSearchSession(sessionId: string): Promise<any> {
    const response = await apiClient.get(`/search/history/${sessionId}`);
    return response.data;
  }

  async stopSearch(sessionId: string): Promise<any> {
    const response = await apiClient.post(`/search/sessions/${sessionId}/stop`);
    return response.data;
  }

  async resumeSearch(sessionId: string): Promise<any> {
    const response = await apiClient.post(`/search/sessions/${sessionId}/resume`);
    return response.data;
  }

  async clearSearchHistory(): Promise<any> {
    const response = await apiClient.delete('/search/history');
    return response.data;
  }

  async getLocationSummary(sessionId: string): Promise<any> {
    const response = await apiClient.get(`/search/history/${sessionId}/location-summary`);
    return response.data;
  }

  private normalizeLeadSearchResponse(response: RawLeadSearchResponse): LeadSearchResponse {
    const data = response?.data;

    let leads: Lead[] = [];
    let rawPagination: Partial<{ page: number; limit: number; total: number; totalPages: number }> | undefined;

    if (Array.isArray(data)) {
      leads = data;
      rawPagination = response?.pagination;
    } else if (data && typeof data === 'object') {
      leads = (data as any)?.leads || [];
      rawPagination = (data as any)?.pagination;
    }

    if (leads.length === 0 && response?.leads && Array.isArray(response.leads)) {
      leads = response.leads;
    }

    const count = response?.count ?? leads.length;

    const fallbackPagination = {
      page: 1,
      limit: count || 1,
      total: count,
      totalPages: count > 0 ? Math.ceil(count / (response?.count || 1)) : 0,
    };

    const normalized: LeadSearchResponse = {
      success: response?.success ?? true,
      message: response?.message || "Request successful",
      count,
      data: {
        leads,
        pagination: {
          ...fallbackPagination,
          ...rawPagination,
          total: rawPagination?.total ?? count,
          totalPages: rawPagination?.totalPages ?? Math.ceil(count / Math.max(rawPagination?.limit || count || 1, 1)),
        },
      },
    };

    return normalized;
  }

  // ── Enrichment API methods ──

  async enrichLead(leadId: string): Promise<Record<string, unknown>> {
    const response = await apiClient.post(`/enrichment/leads/${leadId}/enrich`);
    return response.data;
  }

  async getEnrichmentStatus(leadId: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get(`/enrichment/leads/${leadId}/status`);
    return response.data;
  }

  async enqueueLead(leadId: string): Promise<Record<string, unknown>> {
    const response = await apiClient.post(`/enrichment/leads/${leadId}/enqueue`);
    return response.data;
  }

  async startBackfill(options?: {
    batchSize?: number;
    concurrency?: number;
    skipCompleted?: boolean;
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const response = await apiClient.post('/enrichment/backfill/start', options || {});
    return response.data;
  }

  async getBackfillStatus(): Promise<Record<string, unknown>> {
    const response = await apiClient.get('/enrichment/backfill/status');
    return response.data;
  }

  async getEnrichableLeads(params?: Record<string, string>): Promise<Record<string, unknown>> {
    const queryParts: string[] = [];
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        if (val) queryParts.push(`${key}=${encodeURIComponent(val)}`);
      }
    }
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiClient.get(`/enrichment/leads${query}`);
    return response.data;
  }

  async getOrchestratorStatus(): Promise<Record<string, unknown>> {
    const response = await apiClient.get('/enrichment/status');
    return response.data;
  }
}

export const leadService = new LeadService();
