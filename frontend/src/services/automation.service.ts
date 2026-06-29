import { apiClient } from "@utils/api-client";

export interface Automation {
  id: string;
  keyword: string;
  location: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  limit: number;
  category?: string;
  status: 'active' | 'paused' | 'failed';
  lastRunAt?: string;
  nextRunAt?: string;
  totalRuns: number;
  lastRunLeads: number;
  lastRunStatus: 'success' | 'partial' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCreateRequest {
  keyword: string;
  location: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  limit?: number;
  category?: string;
}

export interface AutomationUpdateRequest {
  keyword?: string;
  location?: string;
  frequency?: 'hourly' | 'daily' | 'weekly';
  limit?: number;
  category?: string;
  status?: 'active' | 'paused';
}

export interface AutomationStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgLeadsPerRun: number;
  totalLeadsGenerated: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface AutomationResponse {
  success: boolean;
  message: string;
  data: Automation | Automation[];
}

export interface AutomationListResponse {
  success: boolean;
  message: string;
  data: {
    automations: Automation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AutomationRunResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    totalLeads: number;
    totalAnalyzed: number;
    totalExtracted: number;
    errors: string[];
  };
}

export interface AutomationLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class AutomationService {
  /**
   * Create a new automation
   */
  async createAutomation(data: AutomationCreateRequest): Promise<AutomationResponse> {
    const response = await apiClient.post<AutomationResponse>("/automation", data);
    return response;
  }

  /**
   * Get all automations
   */
  async getAutomations(page = 1, limit = 10, status?: string, keyword?: string): Promise<AutomationListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (status) params.append('status', status);
    if (keyword) params.append('keyword', keyword);

    const response = await apiClient.get<AutomationListResponse>(`/automation?${params.toString()}`);
    return response;
  }

  /**
   * Get automation by ID
   */
  async getAutomation(id: string): Promise<AutomationResponse> {
    const response = await apiClient.get<AutomationResponse>(`/automation/${id}`);
    return response;
  }

  /**
   * Update automation
   */
  async updateAutomation(id: string, data: AutomationUpdateRequest): Promise<AutomationResponse> {
    const response = await apiClient.patch<AutomationResponse>(`/automation/${id}`, data);
    return response;
  }

  /**
   * Toggle automation status
   */
  async toggleAutomation(id: string): Promise<AutomationResponse> {
    const response = await apiClient.patch<AutomationResponse>(`/automation/${id}/toggle`);
    return response;
  }

  /**
   * Delete automation
   */
  async deleteAutomation(id: string): Promise<AutomationResponse> {
    const response = await apiClient.delete<AutomationResponse>(`/automation/${id}`);
    return response;
  }

  /**
   * Run automation manually
   */
  async runAutomation(id: string): Promise<AutomationRunResponse> {
    const response = await apiClient.post<AutomationRunResponse>(`/automation/${id}/run`);
    return response;
  }

  /**
   * Get automation logs
   */
  async getAutomationLogs(id: string, page = 1, limit = 10, jobType?: string): Promise<AutomationLogsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (jobType) params.append('jobType', jobType);

    const response = await apiClient.get<AutomationLogsResponse>(`/automation/${id}/logs?${params.toString()}`);
    return response;
  }

  /**
   * Get automation statistics
   */
  async getAutomationStatistics(id: string): Promise<AutomationResponse> {
    const response = await apiClient.get<AutomationResponse>(`/automation/${id}/statistics`);
    return response;
  }

  /**
   * Get export history
   */
  async getExportHistory(id: string, page = 1, limit = 10, exportType?: 'csv' | 'excel'): Promise<AutomationListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (exportType) params.append('exportType', exportType);

    const response = await apiClient.get<AutomationListResponse>(`/automation/${id}/exports?${params.toString()}`);
    return response;
  }
}

export const automationService = new AutomationService();
