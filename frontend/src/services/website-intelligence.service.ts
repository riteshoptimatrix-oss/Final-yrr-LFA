import { apiClient } from "@/utils/api-client";

export class WebsiteIntelligenceService {
  async analyzeLead(leadId: string, options?: { timeout?: number; forceRefresh?: boolean }): Promise<any> {
    const response = await apiClient.post(`/website-intelligence/analyze/${leadId}`, options || {});
    return response;
  }

  async reanalyzeLead(leadId: string, options?: { timeout?: number }): Promise<any> {
    const response = await apiClient.post(`/website-intelligence/reanalyze/${leadId}`, options || {});
    return response;
  }

  async analyzeBulk(leadIds: string[]): Promise<any> {
    const response = await apiClient.post("/website-intelligence/analyze-bulk", { leadIds });
    return response;
  }

  async getStats(): Promise<any> {
    const response = await apiClient.get("/website-intelligence/stats");
    return response;
  }
}

export const websiteIntelligenceService = new WebsiteIntelligenceService();
