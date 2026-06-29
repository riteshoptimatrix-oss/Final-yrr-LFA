"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { businessIntelligenceService } from "@/services/business-intelligence.service";
import { toast } from "sonner";

export function useBusinessIntelligenceStats() {
  return useQuery({
    queryKey: ["business-intelligence-stats"],
    queryFn: async () => {
      const response = await businessIntelligenceService.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch business intelligence stats");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useAnalyzeBusinessIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, options }: { leadId: string; options?: any }) => {
      const response = await businessIntelligenceService.analyzeLead(leadId, options);
      if (!response.success) {
        throw new Error(response.message || "Analysis failed");
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["business-intelligence-stats"] });
      toast.success("Business intelligence analysis completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Business intelligence analysis failed");
    },
  });
}

export function useBulkBusinessIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadIds, options }: { leadIds: string[]; options?: any }) => {
      const response = await businessIntelligenceService.analyzeMultipleLeads(leadIds, options);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Bulk analysis failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["business-intelligence-stats"] });
      toast.success(`Analyzed ${data.successful} leads, ${data.failed} failed`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk analysis failed");
    },
  });
}

export function useAnalyzePendingBusinessIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ limit, options }: { limit?: number; options?: any } = {}) => {
      const response = await businessIntelligenceService.analyzePendingLeads(limit, options);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Analysis failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["business-intelligence-stats"] });
      if (data.totalProcessed > 0) {
        toast.success(`Analyzed ${data.successful} pending leads`);
      } else {
        toast.info("No pending leads to analyze");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Analysis failed");
    },
  });
}
