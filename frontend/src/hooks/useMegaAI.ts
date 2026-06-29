"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { megaAIService } from "@/services/mega-ai.service";
import { toast } from "sonner";

export function useMegaPipelineStats() {
  return useQuery({
    queryKey: ["mega-pipeline-stats"],
    queryFn: async () => {
      const response = await megaAIService.getPipelineStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch pipeline stats");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useMegaAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await megaAIService.analyzeLead(leadId);
      if (!response.success) {
        throw new Error(response.message || "Analysis failed");
      }
      return response.data;
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["mega-pipeline-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lead-ai-status", leadId] });
      toast.success("AI analysis queued in background");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Pipeline analysis failed");
    },
  });
}

export function useMegaBulkAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const response = await megaAIService.analyzeMultipleLeads(leadIds);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Bulk analysis failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["mega-pipeline-stats"] });
      toast.success(`Analysis queued for ${data.queued} leads`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk analysis failed");
    },
  });
}

export function useLeadAIStatus(leadId: string | null | undefined) {
  return useQuery({
    queryKey: ["lead-ai-status", leadId],
    queryFn: async () => {
      if (!leadId) throw new Error("No lead ID");
      const response = await megaAIService.getLeadAIStatus(leadId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch AI status");
      }
      return response.data;
    },
    enabled: !!leadId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.aiStatus === 'processing' || data?.aiStatus === 'queued') {
        return 3000;
      }
      return false;
    },
    staleTime: 0,
  });
}

export function useRefreshAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await megaAIService.refreshAnalysis(leadId);
      if (!response.success) {
        throw new Error(response.message || "Refresh failed");
      }
      return response.data;
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ["lead-ai-status", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Analysis refresh queued");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Refresh failed");
    },
  });
}
