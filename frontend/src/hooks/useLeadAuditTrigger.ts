import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead } from '@/types/index';
import { leadService } from '@/services/lead.service';
import { logger } from '@/utils/logger';
import { useLeadStore } from '@/store/useLeadStore';

interface TriggerAuditResult {
  leadId: string;
  responsiveAuditTriggered: boolean;
  businessIntelligenceTriggered: boolean;
  responsiveAuditStatus?: string;
  businessIntelligenceStatus?: string;
  errors?: string[];
}

async function triggerLeadAudits(leadId: string): Promise<TriggerAuditResult> {
  logger.info(`[useLeadAuditTrigger] Calling backend to trigger audits for lead ${leadId}`);
  
  const response = await leadService.triggerLeadAudits(leadId);

  if (!response.success) {
    logger.error(`[useLeadAuditTrigger] API failed: ${JSON.stringify(response)}`);
    throw new Error('Failed to trigger audit');
  }

  logger.info(`[useLeadAuditTrigger] Backend response: ${JSON.stringify(response.data)}`);
  return response.data;
}

export function useLeadAuditTrigger() {
  const queryClient = useQueryClient();
  const updateLeadInStore = useLeadStore((s) => s.updateLead);

  const mutation = useMutation({
    mutationFn: triggerLeadAudits,
    onSuccess: (result) => {
      logger.info(`[useLeadAuditTrigger] Audit completed for lead ${result.leadId}`);
      logger.info(`[useLeadAuditTrigger] Responsive: ${result.responsiveAuditStatus}, Intelligence: ${result.businessIntelligenceStatus}`);

      if (result.responsiveAuditTriggered || result.businessIntelligenceTriggered) {
        logger.info(`[useLeadAuditTrigger] Invalidating query cache for lead ${result.leadId}`);
        queryClient.invalidateQueries({ queryKey: ['lead', result.leadId] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });

        setTimeout(async () => {
          logger.info(`[useLeadAuditTrigger] Refetching lead ${result.leadId} after audit completion`);
          try {
            const freshLead = await queryClient.fetchQuery({
              queryKey: ['lead', result.leadId],
              queryFn: () => leadService.getLeadById(result.leadId),
            });
            if (freshLead?.data && !Array.isArray(freshLead.data)) {
              updateLeadInStore(result.leadId, freshLead.data as Partial<Lead>);
            }
          } catch (err) {
            logger.warn(`[useLeadAuditTrigger] Failed to refresh lead ${result.leadId}: ${err instanceof Error ? err.message : err}`);
          }
        }, 1000);
      }
    },
    onError: (error) => {
      logger.warn(`[useLeadAuditTrigger] Mutation failed: ${error instanceof Error ? error.message : error}`);
    },
  });

  const triggerAudit = useCallback(
    (lead: Lead | null, force: boolean = false) => {
      if (!lead || !lead.id) {
        logger.warn('[useLeadAuditTrigger] No lead provided');
        return;
      }

      if (!lead.hasWebsite || !lead.website) {
        logger.warn('[useLeadAuditTrigger] Lead has no website');
        return;
      }

      const needsResponsiveAudit = !lead.responsiveAuditCompleted;
      const needsBusinessIntelligence = !lead.intelligenceCompleted;

      if (!needsResponsiveAudit && !needsBusinessIntelligence && !force) {
        logger.info('[useLeadAuditTrigger] Lead already has all audits completed');
        return;
      }

      logger.info(`[useLeadAuditTrigger] Triggering audits for lead ${lead.id}`);
      logger.info(`[useLeadAuditTrigger] Needs responsive=${needsResponsiveAudit}, needs intelligence=${needsBusinessIntelligence}, force=${force}`);
      mutation.mutate(lead.id);
    },
    [mutation]
  );

  return {
    triggerAudit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
}
