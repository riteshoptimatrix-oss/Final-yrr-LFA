"use client";

import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadService } from "@/services/lead.service";
import { useLeadStore } from "@/store/useLeadStore";
import { Lead, SearchFilters, PaginatedLeadsResponse } from "@/types/index";

export const LEAD_CATEGORIES_KEY = ["lead-categories"] as const;

export function useLeads(params?: Record<string, string>) {
  const setStoredLeads = useLeadStore((state) => state.setLeads);
  const setStoredPagination = useLeadStore((state) => state.setPagination);
  const storeSetRef = useRef(false);

  const queryKeyParams =
    params && Object.keys(params).length > 0
      ? Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== "")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
      : ["all"];

  const queryKey = ["leads", ...queryKeyParams];

  const apiParams: Record<string, string> = {
    page: "1",
    limit: "12",
    ...(params || {}),
  };

  const query = useQuery<PaginatedLeadsResponse>({
    queryKey,
    queryFn: async () => {
      storeSetRef.current = false;
      const response = await leadService.getLeads(apiParams);
      return response;
    },
    staleTime: 10000,
    gcTime: 300000,
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const leads = query.data?.data ?? [];
  const currentPage = query.data?.currentPage ?? parseInt(apiParams.page, 10);
  const totalPages = query.data?.totalPages ?? 1;
  const totalLeads = query.data?.totalLeads ?? 0;

  if (query.data && !storeSetRef.current) {
    storeSetRef.current = true;
    setStoredPagination({
      page: currentPage,
      limit: parseInt(apiParams.limit, 10),
      total: totalLeads,
      totalPages,
    });
    if (leads.length > 0) {
      setStoredLeads(leads);
    }
  }

  return {
    ...query,
    leads,
    currentPage,
    totalPages,
    totalLeads,
  };
}

export function useLeadCategories() {
  return useQuery({
    queryKey: LEAD_CATEGORIES_KEY,
    queryFn: () => leadService.getCategories(),
    staleTime: 60000,
    refetchInterval: 30000,
  });
}

export function useSearchLeads() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (filters: SearchFilters) => {
      return leadService.searchLeads(filters);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: LEAD_CATEGORIES_KEY }),
        queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] }),
        queryClient.invalidateQueries({ queryKey: ["crm-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics-overview"] }),
      ]);
    },
    onError: () => {},
  });

  const searchLeads = useCallback(
    async (filters: SearchFilters) => {
      return mutation.mutateAsync(filters);
    },
    [mutation]
  );

  return {
    searchLeads,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useLeadDetails(leadId: string | null) {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => leadService.getLeadById(leadId!),
    enabled: !!leadId,
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Lead>) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      leadService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
