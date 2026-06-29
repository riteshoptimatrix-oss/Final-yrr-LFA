"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { automationMonitorService } from "@/services/automation-monitor.service";
import type { SessionLiveStatus, MonitorStats, ExecutionLog, MonitorLogEntry } from "@/services/automation-monitor.service";
import { connectToSession, disconnectFromSession, subscribeToSession } from "@/utils/socket-client";
import type { Socket } from "socket.io-client";

interface SocketEvent {
  type: string;
  sessionId: string;
  timestamp: string;
  status?: string;
  data?: Record<string, unknown>;
}

export function useAutomationMonitor() {
  const params = useParams();
  const sessionId = params?.id as string;
  const queryClient = useQueryClient();

  const [liveLogs, setLiveLogs] = useState<MonitorLogEntry[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentJobStatus, setCurrentJobStatus] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const seenLogKeysRef = useRef<Set<string>>(new Set());

  const pollInterval = socketConnected ? 10000 : 3000;

  const { data: liveStatus, isFetching: liveLoading } = useQuery({
    queryKey: ["automation-monitor-live", sessionId],
    queryFn: () => automationMonitorService.getLiveStatus(sessionId),
    refetchInterval: pollInterval,
    enabled: !!sessionId,
  });

  const { data: statsData } = useQuery({
    queryKey: ["automation-monitor-stats", sessionId],
    queryFn: () => automationMonitorService.getStats(sessionId),
    refetchInterval: pollInterval,
    enabled: !!sessionId,
  });

  const { data: logsData } = useQuery({
    queryKey: ["automation-monitor-logs", sessionId],
    queryFn: () => automationMonitorService.getLogs(sessionId, 500),
    refetchInterval: socketConnected ? 15000 : 8000,
    enabled: !!sessionId,
  });

  const { data: memoryLogsData } = useQuery({
    queryKey: ["automation-monitor-memory", sessionId],
    queryFn: () => automationMonitorService.getMemoryLogs(sessionId),
    refetchInterval: pollInterval,
    enabled: !!sessionId,
  });

  const appendLiveLog = useCallback((entry: MonitorLogEntry) => {
    const key = `${entry.timestamp}:${entry.message}:${entry.level}`;
    if (seenLogKeysRef.current.has(key)) return;
    seenLogKeysRef.current.add(key);
    setLiveLogs(prev => [...prev, entry].slice(-500));
  }, []);

  const invalidateMonitor = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-live", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-stats", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-logs", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-memory", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-progress", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-jobs", sessionId] });
  }, [queryClient, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("area-automation-active-sessions", JSON.stringify([sessionId]));
    }

    const socket = connectToSession(sessionId);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      subscribeToSession(socket, sessionId);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    const handleJobEvent = (event: SocketEvent) => {
      if (event.type === "job:started") {
        setCurrentJobStatus("running");
      } else if (event.type === "job:completed") {
        setCurrentJobStatus("completed");
        invalidateMonitor();
      } else if (event.type === "job:failed") {
        setCurrentJobStatus("failed");
        invalidateMonitor();
      } else if (event.type === "session:status") {
        if (event.status === "completed" || event.status === "failed" || event.status === "paused") {
          setCurrentJobStatus(event.status);
        }
        invalidateMonitor();
      } else if (event.type === "session:progress") {
        invalidateMonitor();
      } else if (event.type === "log:added" && event.data) {
        appendLiveLog(event.data as unknown as MonitorLogEntry);
      }
    };

    socket.on("job:started", handleJobEvent);
    socket.on("job:progress", handleJobEvent);
    socket.on("job:completed", handleJobEvent);
    socket.on("job:failed", handleJobEvent);
    socket.on("session:status", handleJobEvent);
    socket.on("session:progress", handleJobEvent);
    socket.on("log:added", handleJobEvent);
    socket.on("lead:saved", handleJobEvent);
    socket.on("duplicate:removed", handleJobEvent);
    socket.on("lead:rejected", handleJobEvent);

    return () => {
      disconnectFromSession(sessionId);
      socketRef.current = null;
    };
  }, [sessionId, invalidateMonitor, appendLiveLog]);

  const clearLogs = useCallback(() => {
    setLiveLogs([]);
    seenLogKeysRef.current.clear();
    automationMonitorService.clearMemoryLogs(sessionId);
  }, [sessionId]);

  const status = liveStatus?.data ?? null;
  const stats = statsData?.data ?? null;
  const executionLogs = logsData?.data ?? [];
  const memoryLogs = memoryLogsData?.data ?? [];

  const allLogs = [...memoryLogs, ...liveLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 200);

  return {
    sessionId,
    status,
    stats,
    executionLogs,
    liveLogs: allLogs,
    socketConnected,
    currentJobStatus,
    clearLogs,
    isLoading: liveLoading,
  };
}
