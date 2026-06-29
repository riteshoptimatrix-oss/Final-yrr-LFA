import { apiClient } from "@utils/api-client";

export interface WhatsAppLead {
  _id: string;
  id: string;
  companyName: string;
  phone: string;
  normalizedPhone?: string;
  website?: string;
  category?: string;
  city?: string;
  source?: string;
  hasWebsite?: boolean;
  websitePresence?: 'YES' | 'NO';
  detectedWebsiteType?: 'STANDALONE' | 'PROFILE_ONLY' | 'UNKNOWN';
  websiteType?: string;
  report?: {
    generated: boolean;
    generating?: boolean;
    reportUrl?: string | null;
    reportPath?: string | null;
    score?: number | null;
    progress?: {
      stage: string;
      percent: number;
      message: string;
    } | null;
  };
  whatsappOutreach?: {
    status: 'pending' | 'prepared' | 'manually_sent' | 'skipped' | 'failed';
    lastOpenedAt: string | null;
    lastSentAt: string | null;
    templateType: 'website' | 'no-website' | null;
    notes: string;
    campaignId: string | null;
    lastError: string | null;
    outreachAttemptCount: number;
    queuePosition: number | null;
    validationReason?: string;
  };
  leadScore?: number;
  rating?: number;
  phoneValid?: boolean;
  validationReason?: string;
  isWhatsAppValid?: boolean;
  campaignStatus?: 'pending' | 'preparing' | 'validating' | 'sending' | 'completed' | 'stopped' | 'failed';
  lastSent?: string | null;
  attempts?: number;
}

export interface GeneratedMessage {
  leadId: string;
  companyName: string;
  phone: string;
  normalizedPhone: string;
  message: string;
  templateType: 'website' | 'no-website';
  hasWebsite: boolean;
  whatsappUrl: string;
  skipReason: string | null;
}

export interface GenerateMessagesResult {
  success: boolean;
  data: GeneratedMessage[];
  skipped: Array<{ leadId: string; companyName: string; reason: string }>;
  total: number;
  skippedCount: number;
  prepared: number;
  failed: number;
  campaignId: string;
}

export interface WhatsAppStats {
  total: number;
  withWebsite: number;
  pending: number;
  prepared: number;
  manually_sent: number;
  skipped: number;
  failed: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class WhatsAppAutomationService {
  async getLeads(params?: Record<string, string | undefined>): Promise<PaginatedResponse<WhatsAppLead>> {
    const queryParts: string[] = [];
    const filterParams = ['page', 'limit', 'search', 'hasWebsite', 'reportStatus', 'outreachStatus', 'city', 'category', 'source'];

    for (const key of filterParams) {
      const val = params?.[key];
      if (val !== undefined && val !== '') {
        queryParts.push(`${key}=${encodeURIComponent(val)}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const response = await apiClient.get<PaginatedResponse<WhatsAppLead>>(`/whatsapp-automation/leads${queryString}`, {
      timeout: 15000,
    });

    return response;
  }

  async generateMessages(leadIds: string[], campaignId: string, userId: string): Promise<GenerateMessagesResult> {
    const response = await apiClient.post<GenerateMessagesResult>(
      '/whatsapp/generate',
      { leadIds, campaignId, userId }
    );
    return response;
  }

  async trackAction(
    leadId: string,
    action: 'prepared' | 'manually_sent' | 'skipped' | 'failed',
    notes?: string,
    error?: string
  ): Promise<void> {
    await apiClient.post('/whatsapp-automation/track', { leadId, action, notes, error });
  }

  async bulkUpdateStatus(leadIds: string[], status: 'prepared' | 'manually_sent' | 'skipped' | 'pending' | 'failed'): Promise<void> {
    await apiClient.post('/whatsapp-automation/bulk-update', { leadIds, status });
  }

  async getStats(): Promise<WhatsAppStats> {
    const response = await apiClient.get<{ success: boolean; data: WhatsAppStats }>('/whatsapp-automation/stats');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch WhatsApp statistics');
    }
    return response.data;
  }
}

export const whatsAppAutomationService = new WhatsAppAutomationService();
