import { apiClient } from "@utils/api-client";

export interface CampaignLead {
  leadId: string;
  companyName: string;
  phone: string | null;
  website: string;
  city: string;
  messageType: string;
  queuePosition: number;
  status: string;
  error: string | null;
  attempts: number;
  durationMs: number;
  browserState: string;
  updatedAt: number;
  completedAt: number | null;
}

export interface CampaignSession {
  sessionId: string;
  status: string;
  totalLeads: number;
  completed: number;
  failed: number;
  currentLead: string | null;
  currentLeadIndex: number;
  currentStep: string;
  error: string | null;
  eta: number | null;
  elapsedSeconds: number;
  processed: number;
  remaining: number;
  leads: CampaignLead[];
  createdAt: number;
  completedAt: number | null;
}

export interface StartCampaignResponse {
  sessionId: string;
  status: string;
  totalLeads: number;
  completed: number;
  failed: number;
  currentLead: string;
}

class WhatsAppCampaignService {
  async startCampaign(leadIds: string[]): Promise<StartCampaignResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: StartCampaignResponse; message?: string; code?: string }>(
        "/whatsapp-ai/start-campaign",
        { leadIds }
      );
      
      if (!response.success) {
        const errorMessage = response.message || 'Failed to start campaign';
        const errorCode = response.code || 'UNKNOWN_ERROR';
        const error = new Error(errorMessage) as any;
        error.code = errorCode;
        throw error;
      }

      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (err: any) {
      let errorMessage = 'Failed to start campaign';
      let errorCode = 'CAMPAIGN_START_FAILED';

      if (err instanceof Error) {
        errorMessage = err.message || 'Failed to start campaign';
        errorCode = (err as any).code || 'CAMPAIGN_START_FAILED';
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = err.message || err.detail || errorMessage;
        errorCode = err.code || err.error || errorCode;
      }

      const error = new Error(errorMessage) as any;
      error.code = errorCode;
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<CampaignSession> {
    try {
      const response = await apiClient.get<{ success: boolean; data: CampaignSession }>(
        `/whatsapp-ai/campaign-status/${sessionId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to get campaign status');
      }

      return response.data;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to get campaign status';
      throw new Error(errorMessage);
    }
  }

  async stopCampaign(sessionId: string): Promise<{ sessionId: string; status: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: { sessionId: string; status: string } }>(
        `/whatsapp-ai/stop-campaign/${sessionId}`
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to stop campaign');
      }

      return response.data;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to stop campaign';
      throw new Error(errorMessage);
    }
  }
}

export const whatsAppCampaignService = new WhatsAppCampaignService();
