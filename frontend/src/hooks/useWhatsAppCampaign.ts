"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsAppCampaignService, CampaignSession } from "@/services/whatsapp-campaign.service";

export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadIds: string[]) => whatsAppCampaignService.startCampaign(leadIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-leads"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });
}

export function useCampaignStatus(sessionId: string | null, enabled: boolean = true) {
  return useQuery<CampaignSession | null>({
    queryKey: ["campaign-status", sessionId],
    queryFn: () => sessionId ? whatsAppCampaignService.getSessionStatus(sessionId) : null,
    enabled: enabled && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      if (data.status === "completed" || data.status === "failed" || data.status === "stopped" || data.status === "logged_out") {
        return false;
      }
      return 1500;
    },
    staleTime: 0,
  });
}

export function useStopCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => whatsAppCampaignService.stopCampaign(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-status"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-leads"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-stats"] });
    },
  });
}
