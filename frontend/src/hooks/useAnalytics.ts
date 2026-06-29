"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";
import { DateRangeFilter, OverviewAnalytics, LeadAnalytics, AutomationAnalytics } from "@/types/analytics";

export function useOverviewAnalytics(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-overview", filter.startDate, filter.endDate],
    queryFn: async (): Promise<OverviewAnalytics> => {
      console.log(`[useOverviewAnalytics] fetching overview`);
      const response = await analyticsService.getOverview(filter);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch overview");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
  });
}

export function useLeadAnalyticsData(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-leads", filter.startDate, filter.endDate],
    queryFn: async (): Promise<LeadAnalytics> => {
      const response = await analyticsService.getLeadAnalytics(filter);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch lead analytics");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useAutomationAnalyticsData(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-automation", filter.startDate, filter.endDate],
    queryFn: async (): Promise<AutomationAnalytics> => {
      const response = await analyticsService.getAutomationAnalytics(filter);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch automation analytics");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useCategoryDistribution(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-categories", filter.startDate, filter.endDate],
    queryFn: () => analyticsService.getCategoryDistribution(filter),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useLeadsPerDay(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-leads-per-day", filter.startDate, filter.endDate],
    queryFn: () => analyticsService.getLeadsPerDay(filter),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useAreaDensity(filter: DateRangeFilter = {}) {
  return useQuery({
    queryKey: ["analytics-area-density", filter.startDate, filter.endDate],
    queryFn: () => analyticsService.getAreaDensity(filter),
    staleTime: 15000,
    refetchInterval: 15000,
  });
}

export function useTopAreas(filter: DateRangeFilter = {}, limit = 10) {
  return useQuery({
    queryKey: ["analytics-top-areas", filter.startDate, filter.endDate, limit],
    queryFn: () => analyticsService.getTopAreas(filter, limit),
    staleTime: 15000,
    refetchInterval: 15000,
  });
}
