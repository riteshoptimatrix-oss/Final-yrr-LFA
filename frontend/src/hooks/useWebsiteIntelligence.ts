import { useMutation } from "@tanstack/react-query";
import { websiteIntelligenceService } from "@/services/website-intelligence.service";

export function useWebsiteIntelligence() {
  const analyzeMutation = useMutation({
    mutationFn: ({ leadId, forceRefresh }: { leadId: string; forceRefresh?: boolean }) =>
      websiteIntelligenceService.analyzeLead(leadId, { forceRefresh }),
  });

  const reanalyzeMutation = useMutation({
    mutationFn: ({ leadId }: { leadId: string }) =>
      websiteIntelligenceService.reanalyzeLead(leadId),
  });

  return {
    analyze: analyzeMutation.mutateAsync,
    reanalyze: reanalyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    isReanalyzing: reanalyzeMutation.isPending,
    analysisError: analyzeMutation.error || reanalyzeMutation.error,
    analysisData: analyzeMutation.data || reanalyzeMutation.data,
  };
}
