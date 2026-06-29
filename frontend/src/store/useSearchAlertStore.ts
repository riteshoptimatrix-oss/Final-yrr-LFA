"use client";

import { create } from "zustand";
import { SearchState, isSearchActive, isSearchTerminal } from "@/lib/search-state-machine";

export interface SearchLogEntry {
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

export interface SearchAlertState {
  isActive: boolean;
  sessionId: string;
  keyword: string;
  location: string;
  state: string;
  city: string;
  area: string;
  sources: string[];
  searchState: SearchState;
  status: "idle" | "running" | "completed" | "failed" | "stopped";
  leadsFound: number;
  uniqueLeads: number;
  duplicatesRemoved: number;
  failedCount: number;
  sourceBreakdown: Record<string, number>;
  liveLeads: string[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
  error: string;
  currentStage: string;
  currentBusiness: string;
  currentUrl: string;
  eta: number;
  progress: number;
  logs: SearchLogEntry[];
}

interface SearchAlertActions {
  startSearch: (params: {
    sessionId: string;
    keyword: string;
    location: string;
    country?: string;
    state: string;
    city: string;
    area: string;
    sources: string[];
  }) => void;
  setSearchState: (state: SearchState) => void;
  updateProgress: (data: {
    leadsFound?: number;
    uniqueLeads?: number;
    duplicatesRemoved?: number;
    failedCount?: number;
    progress?: number;
    currentSource?: string;
    currentBusiness?: string;
    currentUrl?: string;
    currentStage?: string;
    eta?: number;
  }) => void;
  addLog: (entry: SearchLogEntry) => void;
  addLiveLead: (businessName: string, totalLeads: number) => void;
  completeSearch: (data: {
    totalLeads: number;
    uniqueLeads: number;
    duplicatesRemoved: number;
    failedCount?: number;
    sourceBreakdown: Record<string, number>;
    durationMs?: number;
  }) => void;
  stopSearch: () => void;
  failSearch: (error: string) => void;
  resetSearch: () => void;
}

type SearchAlertStore = SearchAlertState & SearchAlertActions;

const initialState: SearchAlertState = {
  isActive: false,
  sessionId: "",
  keyword: "",
  location: "",
  state: "",
  city: "",
  area: "",
  sources: [],
  searchState: SearchState.IDLE,
  status: "idle",
  leadsFound: 0,
  uniqueLeads: 0,
  duplicatesRemoved: 0,
  failedCount: 0,
  sourceBreakdown: {},
  liveLeads: [],
  startedAt: "",
  completedAt: "",
  durationMs: 0,
  error: "",
  currentStage: "",
  currentBusiness: "",
  currentUrl: "",
  eta: 0,
  progress: 0,
  logs: [],
};

export const useSearchAlertStore = create<SearchAlertStore>()(
  (set) => ({
    ...initialState,

    startSearch: (params) =>
      set({
        isActive: true,
        sessionId: params.sessionId,
        keyword: params.keyword,
        location: params.location,
        state: params.state,
        city: params.city,
        area: params.area,
        sources: params.sources,
        searchState: SearchState.CREATING_SESSION,
        status: "running",
        leadsFound: 0,
        uniqueLeads: 0,
        duplicatesRemoved: 0,
        failedCount: 0,
        sourceBreakdown: {},
        liveLeads: [],
        startedAt: new Date().toISOString(),
        completedAt: "",
        durationMs: 0,
        error: "",
        currentStage: "CREATING_SESSION",
        currentBusiness: "",
        currentUrl: "",
        eta: 0,
        progress: 0,
        logs: [],
      }),

    setSearchState: (searchState) =>
      set((state) => {
        if (!state.isActive) return state;
        return {
          searchState,
          currentStage: searchState,
          status: isSearchTerminal(searchState)
            ? searchState === SearchState.COMPLETED
              ? "completed"
              : searchState === SearchState.FAILED
                ? "failed"
                : "stopped"
            : "running",
          progress: searchState === SearchState.COMPLETED ? 100 : state.progress,
          completedAt: isSearchTerminal(searchState)
            ? new Date().toISOString()
            : state.completedAt,
        };
      }),

    updateProgress: (data) =>
      set((state) => {
        if (!state.isActive) return state;
        return {
          leadsFound: data.leadsFound ?? state.leadsFound,
          uniqueLeads: data.uniqueLeads ?? state.uniqueLeads,
          duplicatesRemoved: data.duplicatesRemoved ?? state.duplicatesRemoved,
          failedCount: data.failedCount ?? state.failedCount,
          progress: data.progress ?? state.progress,
          currentStage: data.currentSource ?? state.currentStage,
          currentBusiness: data.currentBusiness ?? state.currentBusiness,
          currentUrl: data.currentUrl ?? state.currentUrl,
          eta: data.eta ?? state.eta,
        };
      }),

    addLog: (entry) =>
      set((state) => {
        if (!state.isActive) return state;
        const logs = [...state.logs, entry].slice(-200);
        return { logs };
      }),

    addLiveLead: (businessName, totalLeads) =>
      set((state) => {
        if (!state.isActive) return state;
        const liveLeads = state.liveLeads.includes(businessName)
          ? state.liveLeads
          : [...state.liveLeads, businessName].slice(-50);
        return { leadsFound: totalLeads, liveLeads };
      }),

    completeSearch: (data) =>
      set((state) => ({
        searchState: SearchState.COMPLETED,
        status: "completed",
        isActive: false,
        leadsFound: data.totalLeads,
        uniqueLeads: data.uniqueLeads,
        duplicatesRemoved: data.duplicatesRemoved,
        failedCount: data.failedCount ?? state.failedCount,
        sourceBreakdown: data.sourceBreakdown,
        completedAt: new Date().toISOString(),
        durationMs: data.durationMs ?? state.durationMs,
        currentStage: "COMPLETED",
        progress: 100,
      })),

    stopSearch: () =>
      set({
        searchState: SearchState.STOPPED,
        status: "stopped",
        currentStage: "STOPPED",
        completedAt: new Date().toISOString(),
        isActive: false,
      }),

    failSearch: (error) =>
      set({
        searchState: SearchState.FAILED,
        status: "failed",
        error,
        currentStage: "FAILED",
        completedAt: new Date().toISOString(),
        isActive: false,
      }),

    resetSearch: () => set(initialState),
  })
);
