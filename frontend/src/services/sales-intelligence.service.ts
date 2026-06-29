import { apiClient } from "@utils/api-client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface SalesStats {
  total: number;
  analyzed: number;
  notAnalyzed: number;
  averageAiScore: number;
  urgentLeads: number;
  highPriorityLeads: number;
  highConversionLeads: number;
  highRedesignPotential: number;
  highSeoOpportunity: number;
  enterpriseRevenue: number;
  highRevenue: number;
}

export class SalesIntelligenceService {
  async analyzeLead(leadId: string): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/sales-intelligence/analyze/${leadId}`, {});
  }

  async analyzeMultipleLeads(leadIds: string[]): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/sales-intelligence/analyze-bulk', { leadIds });
  }

  async analyzePendingLeads(limit?: number): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/sales-intelligence/analyze-pending', { limit });
  }

  async getStats(): Promise<ApiResponse<SalesStats>> {
    return apiClient.get<ApiResponse<SalesStats>>('/sales-intelligence/stats');
  }
}

export const salesIntelligenceService = new SalesIntelligenceService();
export type { SalesStats };
