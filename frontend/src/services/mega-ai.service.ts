import { apiClient } from "@utils/api-client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface PipelineStats {
  totalLeads: number;
  withWebsite: number;
  responsiveCompleted: number;
  intelligenceCompleted: number;
  salesCompleted: number;
  outreachCompleted: number;
  fullPipelineCompleted: number;
  pendingFullPipeline: number;
}

export interface LeadAIStatus {
  id: string;
  aiStatus: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  aiProgress: number;
  aiCurrentStep: string | null;
  aiCurrentStepIndex: number;
  aiTotalSteps: number;
  aiError: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  lastAuditAt: string | null;
  reportGenerated: boolean;
  responsiveAuditReady: boolean;
  intelligenceReady: boolean;
  outreachReady: boolean;
  salesAIReady: boolean;
  reportReady: boolean;
  responsiveAuditCompleted?: boolean;
  intelligenceCompleted?: boolean;
  salesIntelligenceCompleted?: boolean;
  outreachCompleted?: boolean;
  aiWebsiteHash: string | null;
  website: string | null;
  queueStatus: {
    activeCount: number;
    queueLength: number;
    maxConcurrent: number;
  };
}

export class MegaAIService {
  async analyzeLead(leadId: string): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/mega-ai/analyze/${leadId}`, {});
  }

  async analyzeMultipleLeads(leadIds: string[]): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/mega-ai/analyze-bulk', { leadIds });
  }

  async analyzePendingLeads(limit?: number): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/mega-ai/analyze-pending', { limit });
  }

  async getPipelineStats(): Promise<ApiResponse<PipelineStats>> {
    return apiClient.get<ApiResponse<PipelineStats>>('/mega-ai/pipeline-stats');
  }

  async getLeadAIStatus(leadId: string): Promise<ApiResponse<LeadAIStatus>> {
    return apiClient.get<ApiResponse<LeadAIStatus>>(`/mega-ai/status/${leadId}`);
  }

  async refreshAnalysis(leadId: string): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/mega-ai/refresh/${leadId}`, {});
  }
}

export const megaAIService = new MegaAIService();
export type { PipelineStats };
