"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { outreachService } from "@/services/outreach.service";
import { toast } from "sonner";

export function useOutreachStats() {
  return useQuery({
    queryKey: ["outreach-stats"],
    queryFn: async () => {
      const response = await outreachService.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch outreach stats");
      }
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
}

export function useLeadOutreach(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-outreach", leadId],
    queryFn: async () => {
      if (!leadId) throw new Error("Lead ID required");
      const response = await outreachService.getLeadOutreach(leadId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch outreach data");
      }
      return response.data;
    },
    enabled: !!leadId,
    staleTime: 0,
  });
}

export function useGenerateOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await outreachService.generateForLead(leadId);
      if (!response.success) {
        throw new Error(response.message || "Outreach generation failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-outreach"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-stats"] });
      toast.success("Outreach materials generated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Outreach generation failed");
    },
  });
}

export function useBulkOutreach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      const response = await outreachService.generateForMultipleLeads(leadIds);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Bulk outreach failed");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-stats"] });
      toast.success(`Outreach generated for ${data.successful} leads`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk outreach failed");
    },
  });
}

export function useUpdateOutreachStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const response = await outreachService.updateStatus(leadId, status);
      if (!response.success) {
        throw new Error(response.message || "Status update failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-outreach"] });
      queryClient.invalidateQueries({ queryKey: ["outreach-stats"] });
      toast.success("Outreach status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Status update failed");
    },
  });
}
