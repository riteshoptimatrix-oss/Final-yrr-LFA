import { apiClient } from '../utils/api-client';

export interface SearchLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface SearchStatusData {
  searchSessionId: string;
  keyword: string;
  location: string;
  state?: string;
  city?: string;
  area?: string;
  sources: string[];
  status: 'running' | 'completed' | 'failed' | 'stopped';
  searchState?: string;
  searchStage?: string;
  foundCount: number;
  savedCount: number;
  duplicateCount: number;
  failedCount: number;
  progress: number;
  currentSource: string;
  currentLead: string;
  currentStage?: string;
  currentUrl?: string;
  eta?: number;
  totalProcessed?: number;
  sourceBreakdown: Record<string, number>;
  keywordBreakdown: Record<string, number>;
  liveLeads: string[];
  logs?: SearchLogEntry[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  estimatedTotal: number;
  createdBy?: string;
}

export function mapLegacyProgress(data: Record<string, unknown>): Partial<SearchStatusData> {
  return {
    foundCount: (data.foundCount ?? data.leadsFound ?? data.currentFound ?? 0) as number,
    savedCount: (data.savedCount ?? data.uniqueLeads ?? data.currentSaved ?? 0) as number,
    duplicateCount: (data.duplicateCount ?? data.duplicatesRemoved ?? data.currentDuplicates ?? 0) as number,
    failedCount: (data.failedCount ?? 0) as number,
    progress: (data.progress ?? data.progressPercentage ?? 0) as number,
    currentSource: (data.currentSource ?? '') as string,
    currentLead: (data.currentLead ?? data.currentBusiness ?? '') as string,
    currentStage: (data.currentStage ?? '') as string,
    currentUrl: (data.currentUrl ?? '') as string,
    eta: (data.eta ?? 0) as number,
    totalProcessed: (data.totalProcessed ?? 0) as number,
    updatedAt: (data.updatedAt ?? new Date().toISOString()) as string,
  };
}

export function mapLegacySession(data: Record<string, unknown>): SearchStatusData {
  return {
    searchSessionId: (data.searchSessionId ?? data.sessionId ?? '') as string,
    keyword: (data.keyword ?? '') as string,
    location: (data.location ?? '') as string,
    state: data.state as string | undefined,
    city: data.city as string | undefined,
    area: data.area as string | undefined,
    sources: (data.sources ?? []) as string[],
    status: (data.status ?? 'running') as SearchStatusData['status'],
    searchState: (data.searchState ?? data.searchStage) as string | undefined,
    foundCount: (data.foundCount ?? data.leadsFound ?? data.currentFound ?? 0) as number,
    savedCount: (data.savedCount ?? data.uniqueLeads ?? data.currentSaved ?? 0) as number,
    duplicateCount: (data.duplicateCount ?? data.duplicatesRemoved ?? data.currentDuplicates ?? 0) as number,
    failedCount: (data.failedCount ?? 0) as number,
    progress: (data.progress ?? data.progressPercentage ?? 0) as number,
    currentSource: (data.currentSource ?? '') as string,
    currentLead: (data.currentLead ?? data.currentBusiness ?? '') as string,
    currentStage: (data.currentStage ?? '') as string,
    currentUrl: (data.currentUrl ?? '') as string,
    eta: (data.eta ?? 0) as number,
    totalProcessed: (data.totalProcessed ?? 0) as number,
    sourceBreakdown: (data.sourceBreakdown ?? {}) as Record<string, number>,
    keywordBreakdown: (data.keywordBreakdown ?? {}) as Record<string, number>,
    liveLeads: (data.liveLeads ?? []) as string[],
    logs: (data.logs ?? []) as SearchLogEntry[],
    startedAt: (data.startedAt ?? new Date().toISOString()) as string,
    updatedAt: (data.updatedAt ?? new Date().toISOString()) as string,
    completedAt: data.completedAt as string | undefined,
    error: (data.error ?? data.failureReason) as string | undefined,
    estimatedTotal: (data.estimatedTotal ?? 0) as number,
    createdBy: data.createdBy as string | undefined,
  };
}

export function createEmptyProgress(searchSessionId: string): SearchStatusData {
  return {
    searchSessionId,
    keyword: '',
    location: '',
    sources: [],
    status: 'running',
    searchState: 'IDLE',
    foundCount: 0,
    savedCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    progress: 0,
    currentSource: '',
    currentLead: '',
    currentStage: '',
    currentUrl: '',
    eta: 0,
    totalProcessed: 0,
    sourceBreakdown: {},
    keywordBreakdown: {},
    liveLeads: [],
    logs: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTotal: 0,
  };
}

export interface SearchStatusResponse {
  success: boolean;
  message?: string;
  data: SearchStatusData;
}

export class SearchStatusService {
  async getSearchStatus(sessionId: string): Promise<SearchStatusResponse> {
    const response = await apiClient.get<Record<string, unknown>>(`/scraper/search-progress/${sessionId}`, {
      timeout: 5000,
    });
    const raw = response as unknown as { success: boolean; data: Record<string, unknown> };
    return {
      success: raw.success,
      data: raw.data ? mapLegacySession(raw.data) : createEmptyProgress(sessionId),
    };
  }
}

export const searchStatusService = new SearchStatusService();
