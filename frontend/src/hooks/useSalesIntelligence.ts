"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesIntelligenceService } from "@/services/sales-intelligence.service";
import { toast } from "sonner";

export function useSalesIntelligenceStats() {
  return useQuery({
    queryKey: ["sales-intelligence-stats"],
    queryFn: async () => {
      const response = await salesIntelligenceService.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch sales intelligence stats");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useAnalyzeSalesIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await salesIntelligenceService.analyzeLead(leadId);
      if (!response.success) {
        throw new Error(response.message || "Analysis failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["sales-intelligence-stats"] });
      toast.success("AI sales intelligence analysis completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Sales intelligence analysis failed");
    },
  });
}

export function useBulkSalesIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const response = await salesIntelligenceService.analyzeMultipleLeads(leadIds);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Bulk analysis failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["sales-intelligence-stats"] });
      toast.success(`Analyzed ${data.successful} leads`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk analysis failed");
    },
  });
}
