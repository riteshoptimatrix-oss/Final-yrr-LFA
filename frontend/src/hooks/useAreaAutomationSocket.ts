"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";

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

export function useAreaAutomationSocket(sessionIds: string[]) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());

  const invalidateSession = useCallback((sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: ["area-automation-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-stats"] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-progress", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["area-automation-jobs", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-live", sessionId] });
    queryClient.invalidateQueries({ queryKey: ["automation-monitor-stats", sessionId] });
  }, [queryClient]);

  useEffect(() => {
    if (sessionIds.length === 0) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        subscribedRef.current.clear();
      }
      return;
    }

    const socket = io(`${getSocketUrl()}/automation-monitor`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
    });

    socketRef.current = socket;

    const subscribeAll = () => {
      for (const sessionId of sessionIds) {
        if (!subscribedRef.current.has(sessionId)) {
          socket.emit("subscribe", sessionId);
          subscribedRef.current.add(sessionId);
        }
      }
      for (const existing of subscribedRef.current) {
        if (!sessionIds.includes(existing)) {
          socket.emit("unsubscribe", existing);
          subscribedRef.current.delete(existing);
        }
      }
    };

    socket.on("connect", subscribeAll);

    const handleUpdate = (event: { sessionId?: string }) => {
      const sessionId = event?.sessionId;
      if (sessionId) {
        invalidateSession(sessionId);
      } else {
        queryClient.invalidateQueries({ queryKey: ["area-automation-sessions"] });
        queryClient.invalidateQueries({ queryKey: ["area-automation-stats"] });
      }
    };

    socket.on("session:progress", handleUpdate);
    socket.on("session:status", handleUpdate);
    socket.on("job:started", handleUpdate);
    socket.on("job:progress", handleUpdate);
    socket.on("job:completed", handleUpdate);
    socket.on("job:failed", handleUpdate);
    socket.on("lead:saved", handleUpdate);
    socket.on("duplicate:removed", handleUpdate);
    socket.on("lead:rejected", handleUpdate);
    socket.on("automation:started", handleUpdate);
    socket.on("log:added", handleUpdate);

    subscribeAll();

    return () => {
      socket.off("connect", subscribeAll);
      socket.off("session:progress", handleUpdate);
      socket.off("session:status", handleUpdate);
      socket.off("job:started", handleUpdate);
      socket.off("job:progress", handleUpdate);
      socket.off("job:completed", handleUpdate);
      socket.off("job:failed", handleUpdate);
      socket.off("lead:saved", handleUpdate);
      socket.off("duplicate:removed", handleUpdate);
      socket.off("lead:rejected", handleUpdate);
      socket.off("automation:started", handleUpdate);
      socket.off("log:added", handleUpdate);
      socket.disconnect();
      socketRef.current = null;
      subscribedRef.current.clear();
    };
  }, [sessionIds.join(","), invalidateSession, queryClient]);
}
