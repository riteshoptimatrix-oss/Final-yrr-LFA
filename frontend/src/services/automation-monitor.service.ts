import { apiClient } from "@utils/api-client";

export interface MonitorLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface ExecutionLog {
  id: string;
  sessionId: string;
  jobId: string;
  state: string;
  city: string;
  area: string;
  businessType: string;
  sources: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalLeads: number;
  sourceResults: Array<{
    source: string;
    totalStored: number;
    totalExtracted: number;
    success: boolean;
  }>;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
  workerId: string;
  logs: MonitorLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionLiveStatus {
  sessionId: string;
  status: string;
  currentJob: {
    id: string;
    area: string;
    city: string;
    businessType: string;
    progress: string;
    startedAt: string | null;
    elapsed: number;
  } | null;
  queueLength: number;
  processed: number;
  total: number;
  leadsFound: number;
  startedAt: string | null;
  uptime: number;
}

export interface MonitorStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  pendingJobs: number;
  totalLeads: number;
  totalDuration: number;
  avgJobDuration: number;
  leadsBySource: Record<string, number>;
  errorsByArea: Array<{ area: string; city: string; error: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class AutomationMonitorService {
  async getLogs(sessionId: string, limit = 200): Promise<ApiResponse<ExecutionLog[]>> {
    return apiClient.get(`/automation-monitor/${sessionId}/logs?limit=${limit}`);
  }

  async getLiveStatus(sessionId: string): Promise<ApiResponse<SessionLiveStatus>> {
    return apiClient.get(`/automation-monitor/${sessionId}/live`);
  }

  async getStats(sessionId: string): Promise<ApiResponse<MonitorStats>> {
    return apiClient.get(`/automation-monitor/${sessionId}/stats`);
  }

  async getMemoryLogs(sessionId: string): Promise<ApiResponse<MonitorLogEntry[]>> {
    return apiClient.get(`/automation-monitor/${sessionId}/memory-logs`);
  }

  async clearMemoryLogs(sessionId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/automation-monitor/${sessionId}/memory-logs`);
  }
}

export const automationMonitorService = new AutomationMonitorService();
