import { apiClient } from "@utils/api-client";

export type AreaJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type AreaSessionStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'archived';

export interface AreaAutomationSourceResult {
  source: string;
  totalStored: number;
  totalExtracted: number;
  totalDuplicates: number;
  success: boolean;
}

export interface AreaAutomationJob {
  id: string;
  sessionId: string;
  businessType: string;
  state: string;
  city: string;
  area?: string;
  sources: string[];
  status: AreaJobStatus;
  progress: string;
  totalLeads: number;
  sourceResults: AreaAutomationSourceResult[];
  startedAt: string | null;
  completedAt: string | null;
  failedReason: string | null;
  queuePosition: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
}

export interface AreaAutomationSession {
  id: string;
  name: string;
  businessTypes: string[];
  state: string;
  cities: string[];
  country?: string;
  sources: string[];
  status: AreaSessionStatus;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  skippedJobs: number;
  totalLeads: number;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  archivedAt: string | null;
  retryCount: number;
  lastRunAt: string | null;
  maxLeads: number;
  concurrency: number;
  retryEnabled: boolean;
  dedupEnabled: boolean;
  aiAuditEnabled: boolean;
  autoOutreach: boolean;
  autoReport: boolean;
  autoWhatsApp: boolean;
  schedule: string;
  frequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartAutomationRequest {
  businessTypes: string[];
  state: string;
  cities: string[];
  country?: string;
  sources: string[];
  name?: string;
  maxLeads?: number;
  concurrency?: number;
  retryEnabled?: boolean;
  dedupEnabled?: boolean;
  aiAuditEnabled?: boolean;
  autoOutreach?: boolean;
  autoReport?: boolean;
  autoWhatsApp?: boolean;
  schedule?: string;
  frequency?: string;
  saveAsDraft?: boolean;
}

export interface SessionSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  skippedJobs: number;
  totalLeads: number;
  businessTypesCount: number;
}

export interface AreaAutomationProgress {
  session: AreaAutomationSession;
  jobs: AreaAutomationJob[];
  summary: SessionSummary;
}

export interface SessionsListResult {
  sessions: AreaAutomationSession[];
  total: number;
}

export interface AutomationStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  paused: number;
  draft: number;
  totalLeads: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class AreaAutomationService {
  async startAutomation(data: StartAutomationRequest): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post('/area-automation/start', data);
  }

  async listSessions(params?: {
    status?: string;
    search?: string;
    source?: string;
    state?: string;
    city?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<SessionsListResult>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.source) searchParams.set('source', params.source);
    if (params?.state) searchParams.set('state', params.state);
    if (params?.city) searchParams.set('city', params.city);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const qs = searchParams.toString();
    return apiClient.get(`/area-automation${qs ? `?${qs}` : ''}`);
  }

  async getSession(sessionId: string): Promise<ApiResponse<AreaAutomationProgress>> {
    return apiClient.get(`/area-automation/${sessionId}/progress`);
  }

  async getSessionSummary(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.get(`/area-automation/${sessionId}`);
  }

  async updateSession(sessionId: string, data: Partial<StartAutomationRequest>): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.patch(`/area-automation/${sessionId}`, data);
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/area-automation/${sessionId}`);
  }

  async getJobs(
    sessionId: string,
    params?: { status?: string; businessType?: string; city?: string }
  ): Promise<ApiResponse<AreaAutomationJob[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.businessType) searchParams.set('businessType', params.businessType);
    if (params?.city) searchParams.set('city', params.city);
    const qs = searchParams.toString();
    return apiClient.get(`/area-automation/${sessionId}/jobs${qs ? `?${qs}` : ''}`);
  }

  async stopAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/stop`);
  }

  async pauseAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/pause`);
  }

  async resumeAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/resume`);
  }

  async restartAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/restart`);
  }

  async duplicateAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/duplicate`);
  }

  async archiveAutomation(sessionId: string): Promise<ApiResponse<AreaAutomationSession>> {
    return apiClient.post(`/area-automation/${sessionId}/archive`);
  }

  async getActiveSessions(): Promise<ApiResponse<{ sessions: AreaAutomationSession[] }>> {
    return apiClient.get('/area-automation/active');
  }

  async getStats(): Promise<ApiResponse<AutomationStats>> {
    return apiClient.get('/area-automation/stats');
  }

  async getLocationData(state?: string, city?: string): Promise<ApiResponse<{ state: string; cities?: string[]; areas?: string[]; states?: string[] }>> {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    const qs = params.toString();
    return apiClient.get(`/area-automation/locations${qs ? `?${qs}` : ''}`);
  }
}

export const areaAutomationService = new AreaAutomationService();
