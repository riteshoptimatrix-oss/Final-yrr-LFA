import { apiClient } from '@/utils/api-client';
import { ResponsiveAuditStats, LeadResponsiveData } from '@/types/responsive-audit.types';

interface AuditOptions {
  timeout?: number;
  skipScreenshots?: boolean;
  screenshotQuality?: number;
}

interface AuditResponse {
  success: boolean;
  message: string;
  data: LeadResponsiveData & { leadId: string };
}

interface BulkAuditResponse {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{
      leadId: string;
      success: boolean;
      error?: string;
    }>;
  };
}

interface StatsResponse {
  success: boolean;
  message: string;
  data: ResponsiveAuditStats;
}

export const responsiveAuditService = {
  async auditLead(leadId: string, options?: AuditOptions): Promise<LeadResponsiveData & { leadId: string }> {
    const response = await apiClient.post<AuditResponse>(
      `/responsive-audit/audit/${leadId}`,
      options || {}
    );
    return response.data;
  },

  async auditMultipleLeads(leadIds: string[], options?: AuditOptions): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{
      leadId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const response = await apiClient.post<BulkAuditResponse>('/responsive-audit/audit-bulk', {
      leadIds,
      ...options,
    });
    return response.data;
  },

  async auditPendingLeads(limit?: number, options?: AuditOptions): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: Array<{
      leadId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const response = await apiClient.post<BulkAuditResponse>('/responsive-audit/audit-pending', {
      limit,
      ...options,
    });
    return response.data;
  },

  async getStats(): Promise<ResponsiveAuditStats> {
    const response = await apiClient.get<StatsResponse>('/responsive-audit/stats');
    return response.data;
  },

  async reauditLead(leadId: string, options?: AuditOptions): Promise<LeadResponsiveData & { leadId: string }> {
    const response = await apiClient.post<AuditResponse>(
      `/responsive-audit/reaudit/${leadId}`,
      options || {}
    );
    return response.data;
  },
};
