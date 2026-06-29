"use client";

import { Suspense, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Download,
  FileSpreadsheet,
  SearchSlash,
  RefreshCw,
  SlidersHorizontal,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Check,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Lead } from "@/types/index";
import { leadService } from "@/services/lead.service";
import { useLeads } from "@/hooks/useLeads";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadFilterStore, FilterState } from "@/store/useLeadFilterStore";
import { useSearchAlertStore } from "@/store/useSearchAlertStore";
import type { SearchAlertState } from "@/store/useSearchAlertStore";
import { useFilterOptions, useFilterCounts, useFilterFromUrl } from "@/hooks/useLeadFilters";
import { LeadList } from "@/components/leads/lead-list";
import { LeadDetailsDialog } from "@/components/leads/lead-details-dialog";
import { searchStatusService, createEmptyProgress } from "@/services/search-status.service";
import type { SearchStatusData } from "@/services/search-status.service";
import { SearchProgressBanner } from "@/components/search/search-progress-banner";
import { SearchCompletedDialog, type SearchCompletedSummary } from "@/components/search/search-completed-dialog";
import { useSearchSocket } from "@/hooks/useSearchSocket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

const LEADS_PER_PAGE = 12;

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[11.5px] font-medium text-[#1D4ED8]"
    >
      {label}
      <button onClick={onRemove} className="hover:bg-[#C7D2FE] rounded-full p-0.5 transition-colors">
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </span>
  );
}
  




function LeadsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useFilterFromUrl();

  const {
    filters,
    setFilter,
    setMultipleFilters,
    resetFilters,
    removeChip,
    toQueryParams,
    filterOptions: { options: filterOptions },
  } = useLeadFilterStore();


  const { data: filterOpts } = useFilterOptions();
  const { data: filterCounts } = useFilterCounts();

  const [keywordInput, setKeywordInput] = useState(filters.search);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [searchProgress, setSearchProgress] = useState<SearchStatusData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">("disconnected");
  const [socketSessionId, setSocketSessionId] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<SearchCompletedSummary | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const searchProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSocketUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    setKeywordInput(filters.search);
  }, [filters.search]);

  const queryClient = useQueryClient();
  const searchAlert = useSearchAlertStore();

  const sessionId =
    searchParams.get("sessionId") ||
    searchParams.get("searchSessionId") ||
    (searchAlert.isActive && searchAlert.status === "running" ? searchAlert.sessionId : null);

  useEffect(() => {
    if (sessionId && searchAlert.status !== "completed") {
      setSocketSessionId(sessionId);
    }
  }, [sessionId, searchAlert.status]);

  // Show progress banner immediately when sessionId is in URL
  useEffect(() => {
    if (sessionId && !searchProgress) {
      const alertState = useSearchAlertStore.getState();
      if (alertState.isActive && alertState.sessionId === sessionId) {
        return;
      }
      setSearchProgress(createEmptyProgress(sessionId));
    }
  }, [sessionId, searchProgress]);

  useEffect(() => {
    const activeSessionId =
      sessionId ||
      (searchAlert.isActive && searchAlert.sessionId ? searchAlert.sessionId : null);

    if (searchAlert.isActive && activeSessionId && (searchAlert.status === "running" || searchAlert.status === "completed")) {
      const storeData: SearchStatusData = {
        searchSessionId: searchAlert.sessionId,
        keyword: searchAlert.keyword,
        location: searchAlert.location,
        state: searchAlert.state || undefined,
        city: searchAlert.city || undefined,
        area: searchAlert.area || undefined,
        sources: searchAlert.sources,
        status: searchAlert.status === "completed" ? "completed" : "running",
        searchState: searchAlert.searchState || (searchAlert.status === "running" ? 'SEARCHING' : undefined),
        foundCount: searchAlert.leadsFound,
        savedCount: searchAlert.uniqueLeads,
        duplicateCount: searchAlert.duplicatesRemoved,
        failedCount: searchAlert.failedCount,
        progress: searchAlert.progress,
        currentSource: "",
        currentLead: searchAlert.currentBusiness,
        currentStage: searchAlert.currentStage,
        currentUrl: searchAlert.currentUrl,
        eta: searchAlert.eta,
        sourceBreakdown: searchAlert.sourceBreakdown,
        keywordBreakdown: {},
        liveLeads: searchAlert.liveLeads,
        logs: searchAlert.logs,
        startedAt: searchAlert.startedAt,
        updatedAt: new Date().toISOString(),
        estimatedTotal: 0,
      };
      setSearchProgress(storeData);
      if (searchAlert.status === "running") {
        toast.loading(
          `Searching ${searchAlert.keyword} in ${searchAlert.location || "selected location"}...`,
          { id: `search-${searchAlert.sessionId}`, duration: Infinity }
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket integration for real-time updates
  useSearchSocket(socketSessionId, {
    onConnect() {
      setConnectionStatus("connected");
    },
    onDisconnect() {
      setConnectionStatus("disconnected");
    },
    onReconnecting() {
      setConnectionStatus("reconnecting");
    },
    onStart(data) {
      const alertState = useSearchAlertStore.getState();
      const msgData = data as { keyword: string; location: string; sources: string[]; state?: string; city?: string; area?: string };
      const progress: SearchStatusData = {
        searchSessionId: sessionId || alertState.sessionId,
        keyword: data.keyword || alertState.keyword,
        location: data.location || alertState.location,
        state: msgData.state || alertState.state || undefined,
        city: msgData.city || alertState.city || undefined,
        area: msgData.area || alertState.area || undefined,
        sources: data.sources.length > 0 ? data.sources : alertState.sources,
        status: 'running',
        searchState: 'SEARCHING',
        foundCount: 0,
        savedCount: 0,
        duplicateCount: 0,
        failedCount: 0,
        progress: 0,
        currentSource: '',
        currentLead: '',
        sourceBreakdown: {},
        keywordBreakdown: {},
        liveLeads: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedTotal: 0,
      };
      setSearchProgress(progress);
      lastSocketUpdateRef.current = Date.now();
      searchAlert.startSearch({
        sessionId: progress.searchSessionId,
        keyword: progress.keyword,
        location: progress.location,
        state: progress.state || '',
        city: progress.city || '',
        area: progress.area || '',
        sources: progress.sources,
      });
      toast.loading(
        `Searching ${data.keyword || alertState.keyword} in ${data.location || alertState.location || 'selected location'}...`,
        { id: `search-${progress.searchSessionId}`, duration: Infinity }
      );
    },
    onProgress(data: Partial<SearchStatusData>) {
      setSearchProgress(prev => {
        if (!prev) return null;
        lastSocketUpdateRef.current = Date.now();
        return {
          ...prev,
          foundCount: data.foundCount ?? prev.foundCount,
          savedCount: data.savedCount ?? prev.savedCount,
          duplicateCount: data.duplicateCount ?? prev.duplicateCount,
          failedCount: data.failedCount ?? prev.failedCount,
          progress: data.progress ?? prev.progress,
          currentSource: data.currentSource ?? prev.currentSource,
          currentLead: data.currentLead ?? prev.currentLead,
          updatedAt: data.updatedAt ?? prev.updatedAt,
        };
      });
      searchAlert.updateProgress(data as unknown as Partial<SearchAlertState>);
    },
    onLeadFound(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        const liveLeads = prev.liveLeads.includes(data.businessName)
          ? prev.liveLeads
          : [...prev.liveLeads, data.businessName].slice(-50);
        return { ...prev, foundCount: data.totalLeads, liveLeads };
      });
      searchAlert.addLiveLead(data.businessName, data.totalLeads);
    },
    onLeadSaved(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        return { ...prev, savedCount: data.totalSaved };
      });
      searchAlert.updateProgress({ uniqueLeads: data.totalSaved });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onDuplicateRemoved(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        return { ...prev, duplicateCount: data.totalDuplicates };
      });
    },
    onSourceUpdate(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        return { ...prev, sourceBreakdown: { ...prev.sourceBreakdown, [data.source]: data.count } };
      });
    },
    onCompleted(data) {
      lastSocketUpdateRef.current = Date.now();
      if (searchProgressRef.current) {
        clearInterval(searchProgressRef.current);
        searchProgressRef.current = null;
      }
      
      setSearchProgress(prev => {
        if (!prev) {
          return {
            searchSessionId: sessionId || searchAlert.sessionId,
            keyword: data.keyword || searchAlert.keyword,
            location: data.location || searchAlert.location,
            state: data.state || searchAlert.state || undefined,
            city: data.city || searchAlert.city || undefined,
            area: data.area || searchAlert.area || undefined,
            sources: [],
            status: 'completed',
            searchState: 'COMPLETED',
            completedAt: data.finishedAt || new Date().toISOString(),
            foundCount: data.totalLeads,
            savedCount: data.uniqueLeads,
            duplicateCount: data.duplicatesRemoved,
            failedCount: data.failedCount || 0,
            sourceBreakdown: data.sourceBreakdown,
            progress: 100,
            currentSource: '',
            currentLead: '',
            currentStage: 'COMPLETED',
            currentUrl: '',
            eta: 0,
            totalProcessed: 0,
            keywordBreakdown: {},
            liveLeads: [],
            logs: [],
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedTotal: 0,
          };
        }
        return {
          ...prev,
          status: 'completed',
          completedAt: data.finishedAt || new Date().toISOString(),
          foundCount: data.totalLeads,
          savedCount: data.uniqueLeads,
          duplicateCount: data.duplicatesRemoved,
          failedCount: data.failedCount ?? prev.failedCount,
          sourceBreakdown: data.sourceBreakdown,
          progress: 100,
        };
      });
      searchAlert.completeSearch(data);
      setSocketSessionId(null);
      setSearchProgress(prev => prev ? { ...prev, status: 'completed', progress: 100 } : prev);
      const summary: SearchCompletedSummary = {
        sessionId: sessionId || searchAlert.sessionId,
        keyword: data.keyword || searchAlert.keyword,
        location: data.location || searchAlert.location,
        state: data.state || searchAlert.state || undefined,
        city: data.city || searchAlert.city || undefined,
        area: data.area || searchAlert.area || undefined,
        totalLeads: data.totalLeads,
        uniqueLeads: data.uniqueLeads,
        duplicatesRemoved: data.duplicatesRemoved,
        failedCount: data.failedCount ?? searchAlert.failedCount,
        durationMs: data.durationMs ?? (searchAlert.startedAt
          ? Date.now() - new Date(searchAlert.startedAt).getTime()
          : 0),
      };
      setCompletedSummary(summary);
      setShowCompletedDialog(true);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["filter-options"] });
      queryClient.invalidateQueries({ queryKey: ["filter-counts"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      toast.success(
        `Search Completed — ${data.totalLeads} Businesses Found, ${data.uniqueLeads} Leads Saved`,
        { id: `search-${sessionId || searchAlert.sessionId}`, duration: 5000 }
      );
    },
    onError(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        if (searchProgressRef.current) {
          clearInterval(searchProgressRef.current);
          searchProgressRef.current = null;
        }
        return { ...prev, status: 'failed', error: data.error };
      });
      setSocketSessionId(null);
      searchAlert.failSearch(data.error);
      toast.error(
        data.error || 'Search failed. Please try again.',
        { id: `search-${sessionId || searchAlert.sessionId}`, duration: 8000 }
      );
    },
    onTimeout(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        if (searchProgressRef.current) {
          clearInterval(searchProgressRef.current);
          searchProgressRef.current = null;
        }
        return {
          ...prev,
          status: 'failed',
          searchState: 'TIMEOUT',
          currentStage: 'TIMEOUT',
          error: data.error,
        };
      });
      setSocketSessionId(null);
      searchAlert.failSearch(data.error);
      toast.error(
        data.error || 'Search timed out. Please try again.',
        { id: `search-${sessionId || searchAlert.sessionId}`, duration: 8000 }
      );
    },
    onGoogleBlocked(data) {
      setSearchProgress(prev => {
        if (!prev) return prev;
        lastSocketUpdateRef.current = Date.now();
        if (searchProgressRef.current) {
          clearInterval(searchProgressRef.current);
          searchProgressRef.current = null;
        }
        return {
          ...prev,
          status: 'failed',
          searchState: 'GOOGLE_BLOCKED',
          currentStage: 'GOOGLE_BLOCKED',
          error: data.error,
        };
      });
      setSocketSessionId(null);
      searchAlert.failSearch(data.error);
      toast.error(
        data.error || 'Search blocked by Google. Please wait or change your IP.',
        { id: `search-${sessionId || searchAlert.sessionId}`, duration: 8000 }
      );
    },
    onLog(data) {
      searchAlert.addLog({
        timestamp: data.timestamp,
        message: data.message,
        level: (data.level as "info" | "warn" | "error") || "info",
      });
      setSearchProgress(prev => {
        if (!prev) return prev;
        const logs = [...(prev.logs || []), {
          timestamp: data.timestamp,
          message: data.message,
          level: (data.level as "info" | "warn" | "error") || "info",
        }].slice(-200);
        return { ...prev, logs };
      });
    },
    onStage(data) {
      searchAlert.updateProgress({ currentStage: data.stage });
      setSearchProgress(prev => prev ? { ...prev, currentStage: data.stage } : prev);
    },
    onRecovered(data) {
      const recovered: SearchStatusData = {
        searchSessionId: sessionId || String(data.sessionId || ""),
        keyword: String(data.keyword || ""),
        location: String(data.location || ""),
        state: data.state as string | undefined,
        city: data.city as string | undefined,
        area: data.area as string | undefined,
        sources: (data.sources as string[]) || [],
        status: "running",
        foundCount: Number(data.leadsFound || 0),
        savedCount: Number(data.uniqueLeads || 0),
        duplicateCount: Number(data.duplicatesRemoved || 0),
        failedCount: Number(data.failedCount || 0),
        progress: Number(data.progressPercentage || 0),
        currentSource: "",
        currentLead: "",
        sourceBreakdown: {},
        keywordBreakdown: {},
        liveLeads: [],
        logs: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedTotal: 0,
      };
      setSearchProgress(recovered);
      lastSocketUpdateRef.current = Date.now();
    },
  });

  // REST API state restoration with retry + DB fallback
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    const fetchStatus = async () => {
      while (!cancelled && attempts < 5) {
        try {
          // Try in-memory tracker first
          const response = await searchStatusService.getSearchStatus(sessionId);
          if (!cancelled && response.success && response.data) {
            setSearchProgress(response.data);
            lastSocketUpdateRef.current = Date.now();
            return;
          }
        } catch {
          // retry
        }

        // Fallback: try DB-backed search history endpoint
        if (!cancelled) {
          try {
            const dbResponse = await leadService.getSearchSession(sessionId);
            if (!cancelled && dbResponse?.success && dbResponse?.data) {
              const d = dbResponse.data;
              const dbStatus = d.status || '';
              const mappedStatus = dbStatus === 'completed' ? 'completed' : dbStatus === 'failed' ? 'failed' : dbStatus === 'stopped' ? 'stopped' : 'running';
              setSearchProgress({
                searchSessionId: sessionId,
                keyword: d.keyword || '',
                location: [d.area, d.city, d.state].filter(Boolean).join(', '),
                state: d.state,
                city: d.city,
                area: d.area,
                sources: d.sources || [],
                status: mappedStatus,
                foundCount: d.currentFound || d.totalFound || 0,
                savedCount: d.currentSaved || d.uniqueSaved || 0,
                duplicateCount: d.currentDuplicates || d.duplicates || 0,
                failedCount: d.failedCount || 0,
                progress: mappedStatus === 'completed' ? 100 : (d.progress || 0),
                currentSource: d.currentSource || '',
                currentLead: '',
                sourceBreakdown: d.sourceBreakdown || {},
                keywordBreakdown: {},
                liveLeads: [],
                startedAt: d.startedAt ? new Date(d.startedAt).toISOString() : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: d.completedAt ? new Date(d.completedAt).toISOString() : undefined,
                error: d.error || d.failureReason,
                estimatedTotal: d.estimatedTotal || 0,
              });
              lastSocketUpdateRef.current = Date.now();
              return;
            }
          } catch {
            // silent
          }
        }

        attempts++;
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempts - 1), 8000)));
      }
    };

    fetchStatus();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Fallback polling when socket updates are stale (>5s since last socket event)
  useEffect(() => {
    if (!sessionId || !searchProgress || searchProgress.status !== 'running') {
      if (searchProgressRef.current) {
        clearInterval(searchProgressRef.current);
        searchProgressRef.current = null;
      }
      return;
    }

    const handleTerminal = (sid: string, status: SearchStatusData['status'], data: { error?: string; totalLeads?: number; uniqueLeads?: number; duplicatesRemoved?: number; failedCount?: number; sourceBreakdown?: Record<string, number> }) => {
      if (searchProgressRef.current) {
        clearInterval(searchProgressRef.current);
        searchProgressRef.current = null;
      }
      setSearchProgress(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status,
          progress: status === 'completed' ? 100 : prev.progress,
          completedAt: new Date().toISOString(),
          error: data.error || prev.error,
          foundCount: data.totalLeads ?? prev.foundCount,
          savedCount: data.uniqueLeads ?? prev.savedCount,
          duplicateCount: data.duplicatesRemoved ?? prev.duplicateCount,
          failedCount: data.failedCount ?? prev.failedCount,
          sourceBreakdown: data.sourceBreakdown ?? prev.sourceBreakdown,
          searchState: status === 'completed' ? 'COMPLETED' : status === 'failed' ? 'FAILED' : 'STOPPED',
          currentStage: status === 'completed' ? 'COMPLETED' : status === 'failed' ? 'FAILED' : 'STOPPED',
        };
      });
      searchAlert.completeSearch({
        totalLeads: data.totalLeads || 0,
        uniqueLeads: data.uniqueLeads || 0,
        duplicatesRemoved: data.duplicatesRemoved || 0,
        failedCount: data.failedCount || 0,
        sourceBreakdown: data.sourceBreakdown || {},
      });
      setSocketSessionId(null);
      if (status === 'completed') {
        const summary: SearchCompletedSummary = {
          sessionId: sid,
          keyword: searchAlert.keyword || data.error || '',
          location: searchAlert.location || '',
          state: searchAlert.state || undefined,
          city: searchAlert.city || undefined,
          area: searchAlert.area || undefined,
          totalLeads: data.totalLeads || 0,
          uniqueLeads: data.uniqueLeads || 0,
          duplicatesRemoved: data.duplicatesRemoved || 0,
          failedCount: data.failedCount || 0,
          durationMs: searchAlert.startedAt ? Date.now() - new Date(searchAlert.startedAt).getTime() : 0,
        };
        setCompletedSummary(summary);
        setShowCompletedDialog(true);
        toast.success(
          `Search Completed — ${data.totalLeads || 0} Businesses Found, ${data.uniqueLeads || 0} Leads Saved`,
          { id: `search-${sid}`, duration: 5000 }
        );
      } else if (status === 'failed') {
        toast.error(
          data.error || 'Search failed. Please try again.',
          { id: `search-${sid}`, duration: 8000 }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["filter-options"] });
      queryClient.invalidateQueries({ queryKey: ["filter-counts"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
    };

    searchProgressRef.current = setInterval(async () => {
      const timeSinceLastSocket = Date.now() - lastSocketUpdateRef.current;
      if (timeSinceLastSocket < 5000) return;

      try {
        const response = await searchStatusService.getSearchStatus(sessionId);
        if (response.success && response.data) {
          const d = response.data;
          if (d.status === 'completed' || d.status === 'failed' || d.status === 'stopped') {
            handleTerminal(sessionId, d.status, {
              error: d.error,
              totalLeads: d.foundCount,
              uniqueLeads: d.savedCount,
              duplicatesRemoved: d.duplicateCount,
              failedCount: d.failedCount,
              sourceBreakdown: d.sourceBreakdown,
            });
            return;
          }
          if (d.foundCount > 0) {
            setSearchProgress(prev => {
              if (!prev || prev.status !== 'running') return prev;
              return {
                ...prev,
                foundCount: d.foundCount,
                savedCount: d.savedCount,
                duplicateCount: d.duplicateCount,
                failedCount: d.failedCount,
                progress: d.progress,
                currentSource: d.currentSource,
              };
            });
            return;
          }
        }
      } catch {
        // poll silently
      }

      // Fallback: use DB-backed endpoint
      try {
        const dbResponse = await leadService.getSearchSession(sessionId);
        if (dbResponse?.success && dbResponse?.data) {
          const d = dbResponse.data;
          const dbStatus = (d.status || d.searchState || '') as SearchStatusData['status'];
          if (dbStatus === 'completed' || dbStatus === 'failed' || dbStatus === 'stopped') {
            handleTerminal(sessionId, dbStatus, {
              error: d.error || d.failureReason,
              totalLeads: d.totalFound || d.currentFound,
              uniqueLeads: d.uniqueSaved || d.currentSaved,
              duplicatesRemoved: d.duplicatesRemoved || d.currentDuplicates,
              failedCount: d.failedCount,
              sourceBreakdown: d.sourceBreakdown,
            });
            return;
          }
          setSearchProgress(prev => {
            if (!prev || prev.status !== 'running') return prev;
            return {
              ...prev,
              foundCount: d.currentFound || d.totalFound || prev.foundCount,
              savedCount: d.currentSaved || d.uniqueSaved || prev.savedCount,
              duplicateCount: d.currentDuplicates || d.duplicates || prev.duplicateCount,
              failedCount: d.failedCount ?? prev.failedCount,
              progress: d.progress ?? prev.progress,
              currentSource: d.currentSource || prev.currentSource,
            };
          });
        }
      } catch {
        // poll silently
      }
    }, 2000);

    return () => {
      if (searchProgressRef.current) {
        clearInterval(searchProgressRef.current);
        searchProgressRef.current = null;
      }
    };
  }, [sessionId, searchProgress?.status]);

  const activeFilters = useMemo(() => {
    const chips: { key: keyof FilterState; label: string }[] = [];
    const f = filters;

    if (f.source) chips.push({ key: 'source', label: f.source });
    if (f.state) chips.push({ key: 'state', label: f.state });
    if (f.city) chips.push({ key: 'city', label: f.city });
    if (f.area) chips.push({ key: 'area', label: f.area });
    if (f.businessType) chips.push({ key: 'businessType', label: f.businessType });
    if (f.status) chips.push({ key: 'status', label: f.status });
    if (f.quality) chips.push({ key: 'quality', label: f.quality });
    if (f.confidence) chips.push({ key: 'confidence', label: `Confidence ≥${f.confidence}` });
    if (f.minConfidence) chips.push({ key: 'minConfidence', label: `Conf ≥${f.minConfidence}` });
    if (f.maxConfidence) chips.push({ key: 'maxConfidence', label: `Conf ≤${f.maxConfidence}` });
    if (f.hasWebsite === 'yes') chips.push({ key: 'hasWebsite', label: 'Has Website' });
    if (f.hasWebsite === 'no') chips.push({ key: 'hasWebsite', label: 'No Website' });
    if (f.hasPhone === 'yes') chips.push({ key: 'hasPhone', label: 'Has Phone' });
    if (f.hasPhone === 'no') chips.push({ key: 'hasPhone', label: 'No Phone' });
    if (f.hasEmail === 'yes') chips.push({ key: 'hasEmail', label: 'Has Email' });
    if (f.hasEmail === 'no') chips.push({ key: 'hasEmail', label: 'No Email' });
    if (f.hasWhatsApp === 'yes') chips.push({ key: 'hasWhatsApp', label: 'Has WhatsApp' });
    if (f.hasWhatsApp === 'no') chips.push({ key: 'hasWhatsApp', label: 'No WhatsApp' });
    if (f.validationStatus) chips.push({ key: 'validationStatus', label: f.validationStatus });
    if (f.qualificationLevel) chips.push({ key: 'qualificationLevel', label: f.qualificationLevel });
    if (f.socialOnly) chips.push({ key: 'socialOnly', label: 'Social Only' });
    if (f.verifiedOnly) chips.push({ key: 'verifiedOnly', label: 'Verified Only' });
    if (f.websiteType) chips.push({ key: 'websiteType', label: f.websiteType === 'REAL_WEBSITE' ? 'Real Website' : f.websiteType === 'SOCIAL_PROFILE' ? 'Social Only' : f.websiteType === 'GOOGLE_PROFILE' ? 'Google Profile' : f.websiteType === 'MARKETPLACE_PROFILE' ? 'Marketplace' : f.websiteType === 'DIRECTORY_PROFILE' ? 'Directory' : f.websiteType === 'NO_WEBSITE' ? 'No Website' : f.websiteType });
    return chips;
  }, [filters]);

  const updateUrl = useCallback(() => {
    const params = toQueryParams();
    const currentSessionId = searchParams.get("sessionId") || searchParams.get("searchSessionId");
    if (currentSessionId) {
      params.sessionId = currentSessionId;
    }
    const qs = new URLSearchParams(params).toString();
    router.push(`/leads${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [toQueryParams, router, searchParams]);

  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilter(key, value);
  }, [setFilter]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setFilter('search', keywordInput);
  }, [keywordInput, setFilter]);

  const handleSearchDebounced = useCallback((value: string) => {
    setKeywordInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilter('search', value);
    }, 400);
  }, [setFilter]);

  const handleSearchCompletedClose = useCallback(() => {
    setShowCompletedDialog(false);
    setCompletedSummary(null);
    setSearchProgress(null);
    setSocketSessionId(null);
    searchAlert.resetSearch();
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["filter-options"] });
    queryClient.invalidateQueries({ queryKey: ["filter-counts"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
    queryClient.invalidateQueries({ queryKey: ["search-history"] });
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('sessionId');
    newParams.delete('searchSessionId');
    const qs = newParams.toString();
    router.replace(`/leads${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchAlert, queryClient, searchParams, router]);

  const handleStopSearch = useCallback(async () => {
    const activeSessionId = sessionId || searchAlert.sessionId;
    if (!activeSessionId) {
      toast.error('No active search session found');
      return;
    }
    try {
      const resp = await leadService.stopSearch(activeSessionId);
      if (resp?.success === false) {
        toast.error(resp?.message || 'Failed to stop search');
        return;
      }
      searchAlert.stopSearch();
      setSearchProgress(prev => prev ? {
        ...prev,
        status: 'stopped',
        searchState: 'STOPPED',
        progress: prev.progress,
      } : prev);
      setSocketSessionId(null);
      toast.success('Search stopped', { id: `search-${activeSessionId}`, duration: 3000 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to stop search';
      toast.error(msg);
    }
  }, [sessionId, searchAlert]);

  const handleResumeSearch = useCallback(async () => {
    const activeSessionId = sessionId || searchAlert.sessionId;
    if (!activeSessionId) return;
    try {
      await leadService.resumeSearch(activeSessionId);
      searchAlert.startSearch({
        sessionId: activeSessionId,
        keyword: searchAlert.keyword,
        location: searchAlert.location,
        state: searchAlert.state,
        city: searchAlert.city,
        area: searchAlert.area,
        sources: searchAlert.sources,
      });
      setSocketSessionId(activeSessionId);
      toast.loading(
        `Resuming search for ${searchAlert.keyword}...`,
        { id: `search-${activeSessionId}`, duration: Infinity }
      );
    } catch (err) {
      toast.error('Failed to resume search');
    }
  }, [sessionId, searchAlert]);

  useEffect(() => {
    if (initialized) updateUrl();
  }, [filters, initialized, updateUrl]);

  const apiParams: Record<string, string> = {
    ...toQueryParams(),
    limit: String(LEADS_PER_PAGE),
    page: String(filters.page),
  };

  const {
    leads,
    totalLeads,
    totalPages,
    currentPage,
    isLoading: pageLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isSuccess,
  } = useLeads(apiParams);

  const navigateToPage = useCallback((newPage: number) => {
    setFilter('page', newPage);
  }, [setFilter]);

  const buildExportParams = useCallback(() => {
    const p = toQueryParams();
    delete p.page;
    return p;
  }, [toQueryParams]);

  const handleExportCSV = async () => {
    try {
      const blob = await leadService.exportCsv(buildExportParams());
      leadService.downloadFile(blob, `leads_export_${Date.now()}.csv`, "text/csv");
    } catch (err) {
      console.error("CSV export failed:", err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await leadService.exportExcel(buildExportParams());
      leadService.downloadFile(blob, `leads_export_${Date.now()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  };

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
  }, []);

  const handleDetailsOpenChange = useCallback((open: boolean) => {
    setDetailsOpen(open);
    if (!open) setTimeout(() => setSelectedLead(null), 200);
  }, []);

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const paginationInfo = useMemo(() => ({
    totalLeads, totalPages, currentPage,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  }), [totalLeads, totalPages, currentPage]);

  const PaginationControls = useCallback(({ position }: { position: "top" | "bottom" }) => {
    if (paginationInfo.totalPages <= 1 && !pageLoading) return null;

    return (
      <div className={`flex items-center justify-between gap-3 ${position === "top" ? "pb-4 border-b border-[#E8E5DF]" : "pt-4 border-t border-[#E8E5DF]"}`}>
        <span className="text-[12px] text-[#8E8C86] shrink-0">
          {paginationInfo.totalLeads} lead{paginationInfo.totalLeads !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!paginationInfo.hasPrev}
            onClick={() => navigateToPage(currentPage - 1)}
            className="flex items-center gap-1 h-8 px-3 rounded-[8px] border border-[#E4E1DB] bg-white text-[12.5px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {generatePageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-[12px] text-[#B0AEA8]">...</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => navigateToPage(p as number)}
                  className={`h-8 min-w-[32px] px-2 rounded-[8px] text-[12.5px] font-medium transition-all duration-150 ${
                    p === currentPage ? "bg-[#1D4ED8] text-white shadow-sm" : "border border-[#E4E1DB] bg-white text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            disabled={!paginationInfo.hasNext}
            onClick={() => navigateToPage(currentPage + 1)}
            className="flex items-center gap-1 h-8 px-3 rounded-[8px] border border-[#E4E1DB] bg-white text-[12.5px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }, [paginationInfo, currentPage, totalPages, navigateToPage, pageLoading]);

  const surface = "bg-white border border-[#E8E5DF] rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]";
  const inputCls = "h-10 flex-1 min-w-0 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] px-3.5 text-[13.5px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150";
  const selectTriggerCls = "h-9 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13px] text-[#52525B] focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]";

  const opts = filterOptions || filterOpts;

  return (
    <div className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)", boxShadow: "0 1px 6px rgba(29,78,216,0.22)" }}
          >
            <Users className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.025em] leading-tight">Leads</h1>
            <p className="text-[12.5px] text-[#8E8C86] mt-0.5 leading-tight">
              {filters.search
                ? `Results for "${filters.search}"`
                : `All discovered leads · ${totalLeads} total`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/search")}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150"
          >
            <SearchSlash className="h-3.5 w-3.5" strokeWidth={1.8} />
            New Search
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} strokeWidth={1.8} />
            Refresh
          </button>
        </div>
      </div>

      <div className={`${surface} mb-5 p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#B0AEA8]" strokeWidth={2} />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Search & Filter</span>
          </div>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] border border-[#FECACA] bg-[#FEF2F2] text-[11px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-all duration-150"
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 h-7 px-2.5 rounded-[7px] border text-[11px] font-medium transition-all duration-150 ${
                showFilters ? "bg-[#EEF2FF] border-[#C7D2FE] text-[#1D4ED8]" : "bg-white border-[#E4E1DB] text-[#52525B] hover:bg-[#F5F3EF]"
              }`}
            >
              <Filter className="h-3 w-3" strokeWidth={2} />
              {showFilters ? "Less" : "More"} Filters
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <input
            type="text"
            placeholder="Search by name, website, phone, email, category, location..."
            value={keywordInput}
            onChange={(e) => handleSearchDebounced(e.target.value)}
            className={inputCls}
            suppressHydrationWarning
          />
          <button
            type="submit"
            className="h-10 px-5 rounded-[9px] text-[13.5px] font-semibold text-white shrink-0 transition-all duration-150 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)", boxShadow: "0 1px 4px rgba(29,78,216,0.25)" }}
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
          {filters.search && (
            <button
              type="button"
              onClick={() => { setKeywordInput(''); setFilter('search', ''); }}
              className="h-10 px-4 rounded-[9px] border border-[#E4E1DB] bg-white text-[13.5px] font-medium text-[#52525B] hover:bg-[#F5F3EF] shrink-0 transition-all duration-150"
            >
              Clear
            </button>
          )}
        </form>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#E8E5DF]">
            <span className="text-[11px] font-medium text-[#B0AEA8] mr-1">Active:</span>
            {activeFilters.map(chip => (
              <FilterChip key={chip.key} label={chip.label} onRemove={() => removeChip(chip.key)} />
            ))}
            {filterCounts && (
              <span className="text-[11px] text-[#8E8C86] ml-auto">
                {filterCounts.total} total · {filterCounts.withWebsite} with website · {filterCounts.withPhone} with phone
              </span>
            )}
          </div>
        )}

        <div className="h-px bg-[#E8E5DF] my-0" />

        <div className={`flex flex-wrap items-start gap-2.5 ${showFilters ? 'mt-4' : 'mt-3'}`}>
          <div className="flex items-center gap-1.5 mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#B0AEA8]" strokeWidth={2} />
            <span className="text-[11px] font-medium text-[#B0AEA8]">Filters</span>
          </div>

          <Select value={filters.source || " "} onValueChange={(v) => handleFilterChange('source', v === " " ? "" : v)}>
            <SelectTrigger className={`w-[140px] ${selectTriggerCls}`}>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg max-h-64">
              <SelectItem value=" ">All Sources</SelectItem>
              {(opts?.sources || []).map((item: any) => (
                <SelectItem key={item.value || item} value={item.value || item}>
                  {item.value || item}{item.count ? ` (${item.count})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.state || " "} onValueChange={(v) => { handleFilterChange('state', v === " " ? "" : v); handleFilterChange('city', ''); handleFilterChange('area', ''); }}>
            <SelectTrigger className={`w-[130px] ${selectTriggerCls}`}>
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg max-h-64">
              <SelectItem value=" ">All States</SelectItem>
              {(opts?.states || []).map((s: string) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.city || " "}
            onValueChange={(v) => { handleFilterChange('city', v === " " ? "" : v); handleFilterChange('area', ''); }}
            disabled={!filters.state}
          >
            <SelectTrigger className={`w-[140px] ${selectTriggerCls}`}>
              <SelectValue placeholder={filters.state ? "City" : "Select state first"} />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg max-h-64">
              <SelectItem value=" ">All Cities</SelectItem>
              {(opts?.cities || []).map((c: string) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.area || " "}
            onValueChange={(v) => handleFilterChange('area', v === " " ? "" : v)}
            disabled={!filters.city}
          >
            <SelectTrigger className={`w-[140px] ${selectTriggerCls}`}>
              <SelectValue placeholder={filters.city ? "Area" : "Select city first"} />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg max-h-64">
              <SelectItem value=" ">All Areas</SelectItem>
              {(opts?.areas || []).map((a: string) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.businessType || " "} onValueChange={(v) => handleFilterChange('businessType', v === " " ? "" : v)}>
            <SelectTrigger className={`w-[150px] ${selectTriggerCls}`}>
              <SelectValue placeholder="Business Type" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg max-h-64">
              <SelectItem value=" ">All Types</SelectItem>
              {(opts?.businessTypes || []).map((item: any) => (
                <SelectItem key={item.value || item} value={item.value || item}>
                  {item.value || item}{item.count ? ` (${item.count})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showFilters && (
            <>
              <Select value={filters.status || " "} onValueChange={(v) => handleFilterChange('status', v === " " ? "" : v)}>
                <SelectTrigger className={`w-[120px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value=" ">All Status</SelectItem>
                  {(opts?.statuses || []).map((item: any) => (
                    <SelectItem key={item.value || item} value={item.value || item}>
                      {item.value || item}{item.count ? ` (${item.count})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.quality || " "} onValueChange={(v) => handleFilterChange('quality', v === " " ? "" : v)}>
                <SelectTrigger className={`w-[120px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value=" ">All Quality</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="number"
                placeholder="Min confidence"
                value={filters.minConfidence}
                onChange={(e) => handleFilterChange('minConfidence', e.target.value)}
                min={0}
                max={100}
                className="h-9 w-[105px] rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] px-2.5 text-[12.5px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
              />

              <Select value={filters.validationStatus || " "} onValueChange={(v) => handleFilterChange('validationStatus', v === " " ? "" : v)}>
                <SelectTrigger className={`w-[130px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Validation" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value=" ">All</SelectItem>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="needs-review">Needs Review</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.qualificationLevel || " "} onValueChange={(v) => handleFilterChange('qualificationLevel', v === " " ? "" : v)}>
                <SelectTrigger className={`w-[140px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Qualification" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value=" ">All</SelectItem>
                  <SelectItem value="high-potential">High Potential</SelectItem>
                  <SelectItem value="medium-potential">Medium Potential</SelectItem>
                  <SelectItem value="low-potential">Low Potential</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.websiteType || " "} onValueChange={(v) => handleFilterChange('websiteType', v === " " ? "" : v)}>
                <SelectTrigger className={`w-[130px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Website Type" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value=" ">All Types</SelectItem>
                  <SelectItem value="REAL_WEBSITE">Real Website</SelectItem>
                  <SelectItem value="SOCIAL_PROFILE">Social Only</SelectItem>
                  <SelectItem value="GOOGLE_PROFILE">Google Profile</SelectItem>
                  <SelectItem value="MARKETPLACE_PROFILE">Marketplace</SelectItem>
                  <SelectItem value="DIRECTORY_PROFILE">Directory</SelectItem>
                  <SelectItem value="NO_WEBSITE">No Website</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.hasWebsite} onValueChange={(v) => handleFilterChange('hasWebsite', v)}>
                <SelectTrigger className={`w-[115px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Website" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Has Website</SelectItem>
                  <SelectItem value="no">No Website</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.hasPhone} onValueChange={(v) => handleFilterChange('hasPhone', v)}>
                <SelectTrigger className={`w-[110px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Phone" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Has Phone</SelectItem>
                  <SelectItem value="no">No Phone</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.hasEmail} onValueChange={(v) => handleFilterChange('hasEmail', v)}>
                <SelectTrigger className={`w-[105px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="Email" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Has Email</SelectItem>
                  <SelectItem value="no">No Email</SelectItem>
                </SelectContent>
              </Select>

              <label className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] cursor-pointer hover:bg-[#F0F0EC] transition-colors">
                <input
                  type="checkbox"
                  checked={filters.socialOnly}
                  onChange={(e) => handleFilterChange('socialOnly', e.target.checked)}
                  className="rounded border-[#D4D1CB] text-[#1D4ED8] focus:ring-[#1D4ED8]/20"
                />
                <span className="text-[12px] text-[#52525B] font-medium">Social Only</span>
              </label>

              <label className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] cursor-pointer hover:bg-[#F0F0EC] transition-colors">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                  className="rounded border-[#D4D1CB] text-[#1D4ED8] focus:ring-[#1D4ED8]/20"
                />
                <span className="text-[12px] text-[#52525B] font-medium">Verified Only</span>
              </label>

              <Select value={filters.hasWhatsApp} onValueChange={(v) => handleFilterChange('hasWhatsApp', v)}>
                <SelectTrigger className={`w-[120px] ${selectTriggerCls}`}>
                  <SelectValue placeholder="WhatsApp" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Has WhatsApp</SelectItem>
                  <SelectItem value="no">No WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <div className="flex-1 min-w-0" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#B0AEA8] mr-0.5">Export</span>
            <button
              onClick={handleExportCSV}
              disabled={totalLeads === 0}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#E4E1DB] bg-white text-[12.5px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={totalLeads === 0}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#E4E1DB] bg-white text-[12.5px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#15803D]" strokeWidth={1.8} />
              Excel
            </button>
          </div>
        </div>
      </div>

      {searchProgress && (
        <SearchProgressBanner
          progress={searchProgress}
          connectionStatus={connectionStatus}
          onStop={handleStopSearch}
          onResume={handleResumeSearch}
        />
      )}

      <SearchCompletedDialog
        open={showCompletedDialog}
        onOpenChange={(open) => {
          if (!open) handleSearchCompletedClose();
          else setShowCompletedDialog(true);
        }}
        summary={completedSummary}
      />

      <div className={surface}>
        <div className="px-5 py-4 border-b border-[#E8E5DF]">
          <PaginationControls position="top" />
        </div>
        <div className="px-5 py-5">
          {pageLoading && !isSuccess && !searchProgress ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 rounded-[13px] flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)" }}>
                <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" />
              </div>
              <p className="text-[13.5px] font-medium text-[#52525B]">Loading leads…</p>
              <p className="text-[12px] text-[#B0AEA8] mt-1">Hang tight, fetching your data</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 rounded-[13px] flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
                <AlertCircle className="h-6 w-6 text-[#DC2626]" />
              </div>
              <p className="text-[14px] font-semibold text-[#18181B]">Failed to load leads</p>
              <p className="text-[12.5px] text-[#8E8C86] mt-1 text-center max-w-xs">
                {error instanceof Error ? error.message : "An unexpected error occurred"}
              </p>
              <button onClick={() => refetch()} className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
                Retry
              </button>
            </div>
          ) : leads.length === 0 && isSuccess ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 rounded-[13px] flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#F5F3EF 0%,#EDE9E3 100%)" }}>
                <SearchSlash className="h-6 w-6 text-[#B0AEA8]" />
              </div>
              <p className="text-[14px] font-semibold text-[#18181B]">No leads found</p>
              <p className="text-[12.5px] text-[#8E8C86] mt-1 text-center max-w-xs">
                {Object.keys(toQueryParams()).length > 1
                  ? "Try adjusting your filters or search term."
                  : "Leads will appear here once they are scraped and stored."}
              </p>
              <button
                onClick={() => router.push("/search")}
                className="mt-5 h-9 px-5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)", boxShadow: "0 1px 4px rgba(29,78,216,0.22)" }}
              >
                Start New Search
              </button>
            </div>
          ) : (
            <>
              {isRefetching && (
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE]">
                    <Loader2 className="h-3 w-3 text-[#1D4ED8] animate-spin" />
                    <span className="text-[11px] font-medium text-[#1D4ED8]">Updating…</span>
                  </div>
                </div>
              )}
              <LeadList leads={leads} onLeadClick={handleLeadClick} />
              {leads.length > 0 && (
                <div className="mt-3 text-center">
                  <span className="text-[11.5px] text-[#B0AEA8]">
                    Showing {leads.length} of {totalLeads} lead{totalLeads !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        {leads.length > 0 && (
          <div className="px-5 py-4 border-t border-[#E8E5DF]">
            <PaginationControls position="bottom" />
          </div>
        )}
      </div>

      <LeadDetailsDialog lead={selectedLead} open={detailsOpen} onOpenChange={handleDetailsOpenChange} />
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(total);
  }
  return pages;
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#F5F3EF] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-[13px] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)" }}>
              <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" />
            </div>
            <span className="text-[13.5px] font-medium text-[#52525B]">Loading leads…</span>
          </div>
        </div>
      }
    >
      <LeadsContent />
    </Suspense>
  );
}