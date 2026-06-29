"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSearchAlertStore } from "@/store/useSearchAlertStore";
import { SearchState } from "@/lib/search-state-machine";
import type { SearchStatusData } from "@/services/search-status.service";

function getSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export interface SearchProgressPayload {
  searchSessionId: string;
  currentSource: string;
  foundCount: number;
  savedCount: number;
  duplicateCount: number;
  failedCount: number;
  progress: number;
  currentLead: string;
  currentStage?: string;
  currentUrl?: string;
  eta?: number;
  totalProcessed?: number;
  updatedAt: string;
}

export interface SearchSocketEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnecting?: () => void;
  onStart?: (data: { keyword: string; location: string; sources: string[]; state?: string; city?: string; area?: string }) => void;
  onProgress?: (data: Partial<SearchStatusData>) => void;
  onLeadFound?: (data: { businessName: string; source: string; totalLeads: number }) => void;
  onLeadSaved?: (data: { totalSaved: number }) => void;
  onDuplicateRemoved?: (data: { totalDuplicates: number }) => void;
  onSourceUpdate?: (data: { source: string; count: number; status: string }) => void;
  onCompleted?: (data: {
    totalLeads: number;
    uniqueLeads: number;
    duplicatesRemoved: number;
    failedCount?: number;
    sourceBreakdown: Record<string, number>;
    durationMs?: number;
    keyword?: string;
    location?: string;
    state?: string;
    city?: string;
    area?: string;
    status?: string;
    progress?: number;
    finishedAt?: string;
  }) => void;
  onError?: (data: { error: string }) => void;
  onStopped?: () => void;
  onTimeout?: (data: { error: string }) => void;
  onGoogleBlocked?: (data: { error: string }) => void;
  onLog?: (data: { timestamp: string; message: string; level: string }) => void;
  onStage?: (data: { stage: string }) => void;
  onRecovered?: (data: Record<string, unknown>) => void;
  onHistoryUpdate?: (data: { keyword: string; state?: string; city?: string; area?: string; sources: string[]; totalLeads: number; status: string }) => void;
}

export function useSearchSocket(
  sessionId: string | null,
  events: SearchSocketEvents = {}
) {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  const cleanupRef = useRef(false);
  eventsRef.current = events;

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    cleanupRef.current = true;
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const url = getSocketUrl();
    const socket: Socket = io(`${url}/automation-monitor`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
      query: { sessionId },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      socket.emit("subscribe", sessionId);
      eventsRef.current.onConnect?.();
    });

    socket.on("disconnect", () => {
      eventsRef.current.onDisconnect?.();
    });

    socket.io.on("reconnect_attempt", () => {
      eventsRef.current.onReconnecting?.();
    });

    socket.on("search:start", (msg: { data: { keyword: string; location: string; sources: string[]; state?: string; city?: string; area?: string } }) => {
      eventsRef.current.onStart?.(msg.data);
    });

    socket.on("search:recovered", (msg: { data: Record<string, unknown> }) => {
      eventsRef.current.onRecovered?.(msg.data);
    });

    socket.on("search:progress", (data: SearchProgressPayload) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.updateProgress({
          leadsFound: data.foundCount,
          uniqueLeads: data.savedCount,
          duplicatesRemoved: data.duplicateCount,
          failedCount: data.failedCount,
          progress: data.progress,
          currentBusiness: data.currentLead,
          currentUrl: data.currentUrl,
          eta: data.eta,
        });
      }
      eventsRef.current.onProgress?.(data as unknown as Partial<SearchStatusData>);
    });

    socket.on("search:completed", (msg: { data: {
      totalLeads: number;
      uniqueLeads: number;
      duplicatesRemoved: number;
      failedCount?: number;
      sourceBreakdown: Record<string, number>;
      durationMs?: number;
      keyword?: string;
      location?: string;
      state?: string;
      city?: string;
      area?: string;
      status?: string;
      progress?: number;
      finishedAt?: string;
    } }) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.completeSearch({
          totalLeads: msg.data.totalLeads || 0,
          uniqueLeads: msg.data.uniqueLeads || 0,
          duplicatesRemoved: msg.data.duplicatesRemoved || 0,
          failedCount: msg.data.failedCount || 0,
          sourceBreakdown: msg.data.sourceBreakdown || {},
          durationMs: msg.data.durationMs || 0,
        });
      }
      eventsRef.current.onCompleted?.(msg.data);
    });

    socket.on("search:error", (msg: { data: { error: string } }) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.failSearch(msg.data.error);
      }
      eventsRef.current.onError?.(msg.data);
    });

    socket.on("search:timeout", (msg: { data: { error: string } }) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.failSearch(msg.data.error);
      }
      eventsRef.current.onTimeout?.(msg.data);
    });

    socket.on("search:google-blocked", (msg: { data: { error: string } }) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.failSearch(msg.data.error);
      }
      eventsRef.current.onGoogleBlocked?.(msg.data);
    });

    socket.on("search:stopped", () => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.stopSearch();
      }
      eventsRef.current.onStopped?.();
    });

    socket.on("log:added", (msg: { data: { timestamp: string; message: string; level: string } }) => {
      const store = useSearchAlertStore.getState();
      if (store.isActive) {
        store.addLog({
          timestamp: msg.data.timestamp,
          message: msg.data.message,
          level: msg.data.level as "info" | "warn" | "error",
        });
      }
      eventsRef.current.onLog?.(msg.data);
    });

    socket.on("lead:found", (msg: { data: { businessName: string; source: string; totalLeads: number } }) => {
      eventsRef.current.onLeadFound?.(msg.data);
    });

    socket.on("lead:saved", (msg: { data: { totalSaved: number } }) => {
      eventsRef.current.onLeadSaved?.(msg.data);
    });

    socket.on("duplicate:removed", (msg: { data: { totalDuplicates: number } }) => {
      eventsRef.current.onDuplicateRemoved?.(msg.data);
    });

    socket.on("source:update", (msg: { data: { source: string; count: number; status: string } }) => {
      eventsRef.current.onSourceUpdate?.(msg.data);
    });

    socket.on("search:history-update", (msg: { data: { keyword: string; state?: string; city?: string; area?: string; sources: string[]; totalLeads: number; status: string } }) => {
      eventsRef.current.onHistoryUpdate?.(msg.data);
    });

    socket.on("search:stage", (msg: { data: { stage: string } }) => {
      eventsRef.current.onStage?.(msg.data);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("unsubscribe", sessionId);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  return { socket: socketRef.current, cleanup };
}
