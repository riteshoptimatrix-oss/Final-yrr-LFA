"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  areaAutomationService,
  AreaAutomationSession,
  AreaAutomationProgress,
  AreaAutomationJob,
  StartAutomationRequest,
  AutomationStats,
  SessionsListResult,
} from "@/services/area-automation.service";
import { useAreaAutomationSocket } from "./useAreaAutomationSocket";

const ACTIVE_SESSIONS_KEY = "area-automation-active-sessions";

function readStoredActiveSessions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredActiveSessions(ids: string[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(ids.slice(0, 20)));
}

export function useAreaAutomation() {
  const queryClient = useQueryClient();
  const [activeSessionIds, setActiveSessionIds] = useState<string[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [hasRunningSessions, setHasRunningSessions] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    search?: string;
    source?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: string;
  }>({});

  const invalidateSessions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["area-automation-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-stats"] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    invalidateSessions();
    queryClient.invalidateQueries({ queryKey: ["area-automation-progress"] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }, [queryClient, invalidateSessions]);

  const activeRecoveryQuery = useQuery({
    queryKey: ["area-automation-active"],
    queryFn: async () => {
      const response = await areaAutomationService.getActiveSessions();
      if (response.success && response.data?.sessions) {
        return response.data.sessions as AreaAutomationSession[];
      }
      return [];
    },
    staleTime: 10000,
  });

  useEffect(() => {
    const stored = readStoredActiveSessions();
    if (stored.length > 0) {
      setActiveSessionIds(stored);
    }
  }, []);

  useEffect(() => {
    const recovered = activeRecoveryQuery.data || [];
    if (recovered.length === 0) return;
    setActiveSessionIds(prev => {
      const combined = [...new Set([...recovered.map(s => s.id), ...prev])];
      writeStoredActiveSessions(combined);
      return combined.slice(0, 20);
    });
    setHasRunningSessions(true);
  }, [activeRecoveryQuery.data]);

  const socketSessionIds = useMemo(
    () => activeSessionIds.filter(Boolean),
    [activeSessionIds]
  );
  useAreaAutomationSocket(socketSessionIds);

  const startMutation = useMutation({
    mutationFn: (data: StartAutomationRequest) => areaAutomationService.startAutomation(data),
    onSuccess: (response) => {
      setStartError(null);
      if (response.success && response.data) {
        setActiveSessionIds(prev => {
          const next = [response.data.id, ...prev.filter(id => id !== response.data.id)];
          writeStoredActiveSessions(next);
          return next.slice(0, 20);
        });
      }
      invalidateAll();
    },
    onError: (error: Error) => {
      setStartError(error.message);
    },
  });

  const stopMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.stopAutomation(sessionId),
    onSuccess: () => { invalidateAll(); },
  });

  const pauseMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.pauseAutomation(sessionId),
    onSuccess: () => { invalidateAll(); },
  });

  const resumeMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.resumeAutomation(sessionId),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setActiveSessionIds(prev => {
          const next = [response.data.id, ...prev.filter(id => id !== response.data.id)];
          writeStoredActiveSessions(next);
          return next.slice(0, 20);
        });
      }
      invalidateAll();
    },
  });

  const restartMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.restartAutomation(sessionId),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setActiveSessionIds(prev => {
          const next = [response.data.id, ...prev.filter(id => id !== response.data.id)];
          writeStoredActiveSessions(next);
          return next.slice(0, 20);
        });
      }
      invalidateAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.deleteSession(sessionId),
    onSuccess: (_response, sessionId) => {
      setActiveSessionIds(prev => {
        const next = prev.filter(id => id !== sessionId);
        writeStoredActiveSessions(next);
        return next;
      });
      invalidateSessions();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.duplicateAutomation(sessionId),
    onSuccess: () => { invalidateSessions(); },
  });

  const archiveMutation = useMutation({
    mutationFn: (sessionId: string) => areaAutomationService.archiveAutomation(sessionId),
    onSuccess: () => { invalidateSessions(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: Partial<StartAutomationRequest> }) =>
      areaAutomationService.updateSession(sessionId, data),
    onSuccess: () => { invalidateAll(); },
  });

  const sessionsQuery = useQuery({
    queryKey: ["area-automation-sessions", filters],
    queryFn: async () => areaAutomationService.listSessions({
      ...filters,
      limit: 50,
    }),
    refetchInterval: hasRunningSessions ? 5000 : 10000,
  });

  const statsQuery = useQuery({
    queryKey: ["area-automation-stats"],
    queryFn: () => areaAutomationService.getStats(),
    refetchInterval: hasRunningSessions ? 5000 : 10000,
  });

  const startAutomation = useCallback(
    async (data: StartAutomationRequest) => {
      setStartError(null);
      return startMutation.mutateAsync(data);
    },
    [startMutation]
  );

  const stopAutomation = useCallback(
    async (sessionId: string) => stopMutation.mutateAsync(sessionId),
    [stopMutation]
  );

  const pauseAutomation = useCallback(
    async (sessionId: string) => pauseMutation.mutateAsync(sessionId),
    [pauseMutation]
  );

  const resumeAutomation = useCallback(
    async (sessionId: string) => resumeMutation.mutateAsync(sessionId),
    [resumeMutation]
  );

  const restartAutomation = useCallback(
    async (sessionId: string) => restartMutation.mutateAsync(sessionId),
    [restartMutation]
  );

  const deleteAutomation = useCallback(
    async (sessionId: string) => deleteMutation.mutateAsync(sessionId),
    [deleteMutation]
  );

  const duplicateAutomation = useCallback(
    async (sessionId: string) => duplicateMutation.mutateAsync(sessionId),
    [duplicateMutation]
  );

  const archiveAutomation = useCallback(
    async (sessionId: string) => archiveMutation.mutateAsync(sessionId),
    [archiveMutation]
  );

  const updateAutomation = useCallback(
    async (sessionId: string, data: Partial<StartAutomationRequest>) =>
      updateMutation.mutateAsync({ sessionId, data }),
    [updateMutation]
  );

  useEffect(() => {
    const data = sessionsQuery.data;
    if (data?.success && data.data) {
      const list = data.data as SessionsListResult;
      const sessions = list.sessions || [];
      const activeSessions = sessions.filter(s => s.status === "running");
      setHasRunningSessions(activeSessions.length > 0 || (activeRecoveryQuery.data?.length || 0) > 0);
      setActiveSessionIds(prev => {
        const newIds = activeSessions.map(s => s.id);
        const combined = [...new Set([...newIds, ...prev])];
        writeStoredActiveSessions(combined);
        return combined.slice(0, 20);
      });
    }
  }, [sessionsQuery.data, activeRecoveryQuery.data]);

  const sessionsData = sessionsQuery.data?.data as SessionsListResult | undefined;

  return {
    startAutomation,
    stopAutomation,
    pauseAutomation,
    resumeAutomation,
    restartAutomation,
    deleteAutomation,
    duplicateAutomation,
    archiveAutomation,
    updateAutomation,
    sessions: sessionsData?.sessions || [],
    sessionsTotal: sessionsData?.total || 0,
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.error,
    stats: statsQuery.data?.data as AutomationStats | null,
    statsLoading: statsQuery.isLoading,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isRestarting: restartMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isUpdating: updateMutation.isPending,
    startError,
    hasRunningSessions,
    activeSessionIds,
    filters,
    setFilters,
    refetchSessions: () => invalidateSessions(),
  };
}

export function useSessionProgress(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["area-automation-progress", sessionId],
    queryFn: async (): Promise<AreaAutomationProgress | null> => {
      if (!sessionId) return null;
      const response = await areaAutomationService.getSession(sessionId);
      if (response.success && response.data) {
        return response.data as AreaAutomationProgress;
      }
      return null;
    },
    enabled: !!sessionId && enabled,
    refetchInterval: enabled && sessionId ? 3000 : false,
  });
}

export function useSessionJobs(
  sessionId: string | null,
  jobFilters?: { status?: string; businessType?: string; city?: string }
) {
  return useQuery({
    queryKey: ["area-automation-jobs", sessionId, jobFilters],
    queryFn: async (): Promise<AreaAutomationJob[]> => {
      if (!sessionId) return [];
      const response = await areaAutomationService.getJobs(sessionId, jobFilters);
      if (response.success && Array.isArray(response.data)) {
        return response.data as AreaAutomationJob[];
      }
      return [];
    },
    enabled: !!sessionId,
    refetchInterval: 3000,
  });
}
