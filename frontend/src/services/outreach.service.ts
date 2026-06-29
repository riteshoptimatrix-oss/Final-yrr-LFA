import { apiClient } from "@utils/api-client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface OutreachStats {
  total: number;
  outreachCompleted: number;
  pendingOutreach: number;
  highProbabilityLeads: number;
  readyForProposal: number;
  respondedLeads: number;
  interestedLeads: number;
  highRedesignProspects: number;
  highSEOProspects: number;
}

export class OutreachService {
  async generateForLead(leadId: string): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>(`/outreach/generate/${leadId}`, {});
  }

  async generateForMultipleLeads(leadIds: string[]): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/outreach/generate-bulk', { leadIds });
  }

  async generateForPendingLeads(limit?: number): Promise<ApiResponse<any>> {
    return apiClient.post<ApiResponse<any>>('/outreach/generate-pending', { limit });
  }

  async getLeadOutreach(leadId: string): Promise<ApiResponse<any>> {
    return apiClient.get<ApiResponse<any>>(`/outreach/lead/${leadId}`);
  }

  async updateStatus(leadId: string, status: string): Promise<ApiResponse<any>> {
    return apiClient.put<ApiResponse<any>>(`/outreach/status/${leadId}`, { status });
  }

  async getStats(): Promise<ApiResponse<OutreachStats>> {
    return apiClient.get<ApiResponse<OutreachStats>>('/outreach/stats');
  }
}

export const outreachService = new OutreachService();
export type { OutreachStats };
