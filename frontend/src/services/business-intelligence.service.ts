import { apiClient } from "@utils/api-client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface IntelligenceOptions {
  timeout?: number;
  includeDeepAnalysis?: boolean;
}

interface BulkResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  results: Array<{ leadId: string; success: boolean; error?: string }>;
}

interface IntelligenceStats {
  total: number;
  analyzed: number;
  notAnalyzed: number;
  averageTrustScore: number;
  averageQualityScore: number;
  highOpportunity: number;
  mediumOpportunity: number;
  lowOpportunity: number;
  websitesWithOutdatedDesign: number;
  businessesWithoutSocial: number;
  businessesWithoutContactForm: number;
  weakTrustScore: number;
  outdatedCopyright: number;
}

export class BusinessIntelligenceService {
  async analyzeLead(leadId: string, options?: IntelligenceOptions): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/business-intelligence/analyze/${leadId}`, options || {});
  }

  async analyzeMultipleLeads(leadIds: string[], options?: IntelligenceOptions): Promise<ApiResponse<BulkResult>> {
    return apiClient.post<ApiResponse<BulkResult>>('/business-intelligence/analyze-bulk', { leadIds, ...options });
  }

  async analyzePendingLeads(limit?: number, options?: IntelligenceOptions): Promise<ApiResponse<BulkResult>> {
    return apiClient.post<ApiResponse<BulkResult>>('/business-intelligence/analyze-pending', { limit, ...options });
  }

  async getStats(): Promise<ApiResponse<IntelligenceStats>> {
    return apiClient.get<ApiResponse<IntelligenceStats>>('/business-intelligence/stats');
  }

  async reanalyzeLead(leadId: string, options?: IntelligenceOptions): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/business-intelligence/reanalyze/${leadId}`, options || {});
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();
export type { IntelligenceStats, BulkResult, IntelligenceOptions };
