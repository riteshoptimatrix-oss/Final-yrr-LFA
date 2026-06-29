"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsAppAutomationService } from "@/services/whatsapp-automation.service";

export function useWhatsAppLeads(params?: Record<string, string | undefined>) {
  const queryKeyParams =
    params && Object.keys(params).length > 0
      ? Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== "")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
      : ["all"];

  const queryKey = ["whatsapp-leads", ...queryKeyParams];

  return useQuery({
    queryKey,
    queryFn: () => whatsAppAutomationService.getLeads(params),
    staleTime: 10000,
    refetchInterval: 15000,
    retry: 1,
  });
}

export function useWhatsAppStats() {
  return useQuery({
    queryKey: ["whatsapp-stats"],
    queryFn: () => whatsAppAutomationService.getStats(),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useGenerateMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadIds, campaignId, userId }: { leadIds: string[]; campaignId: string; userId: string }) =>
      whatsAppAutomationService.generateMessages(leadIds, campaignId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-leads"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });
}

export function useTrackAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, action, notes, error }: { leadId: string; action: 'prepared' | 'manually_sent' | 'skipped' | 'failed'; notes?: string; error?: string }) =>
      whatsAppAutomationService.trackAction(leadId, action, notes, error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-leads"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadIds, status }: { leadIds: string[]; status: 'prepared' | 'manually_sent' | 'skipped' | 'pending' | 'failed' }) =>
      whatsAppAutomationService.bulkUpdateStatus(leadIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-leads"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });
}
