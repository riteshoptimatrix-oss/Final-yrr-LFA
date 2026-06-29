import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { responsiveAuditService } from '@/services/responsive-audit.service';
import { toast } from 'sonner';

export function useResponsiveAudit() {
  const queryClient = useQueryClient();
  const [auditingLeadId, setAuditingLeadId] = useState<string | null>(null);

  const auditLeadMutation = useMutation({
    mutationFn: ({ 
      leadId, 
      options 
    }: { 
      leadId: string; 
      options?: { timeout?: number; skipScreenshots?: boolean; screenshotQuality?: number };
    }) => {
      setAuditingLeadId(leadId);
      return responsiveAuditService.auditLead(leadId, options);
    },
    onSuccess: (data) => {
      toast.success('Responsive audit completed successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
      setAuditingLeadId(null);
    },
    onError: (error: Error) => {
      toast.error(`Audit failed: ${error.message}`);
      setAuditingLeadId(null);
    },
  });

  const auditMultipleMutation = useMutation({
    mutationFn: ({ 
      leadIds, 
      options 
    }: { 
      leadIds: string[]; 
      options?: { timeout?: number; skipScreenshots?: boolean; screenshotQuality?: number };
    }) => {
      return responsiveAuditService.auditMultipleLeads(leadIds, options);
    },
    onSuccess: (data) => {
      toast.success(`Bulk audit completed: ${data.successful} successful, ${data.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Bulk audit failed: ${error.message}`);
    },
  });

  const auditPendingMutation = useMutation({
    mutationFn: ({ 
      limit, 
      options 
    }: { 
      limit?: number; 
      options?: { timeout?: number; skipScreenshots?: boolean; screenshotQuality?: number };
    }) => {
      return responsiveAuditService.auditPendingLeads(limit, options);
    },
    onSuccess: (data) => {
      toast.success(`Pending audits completed: ${data.successful} successful, ${data.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: Error) => {
      toast.error(`Pending audits failed: ${error.message}`);
    },
  });

  const reauditLeadMutation = useMutation({
    mutationFn: ({ 
      leadId, 
      options 
    }: { 
      leadId: string; 
      options?: { timeout?: number; skipScreenshots?: boolean; screenshotQuality?: number };
    }) => {
      setAuditingLeadId(leadId);
      return responsiveAuditService.reauditLead(leadId, options);
    },
    onSuccess: (data) => {
      toast.success('Re-audit completed successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
      setAuditingLeadId(null);
    },
    onError: (error: Error) => {
      toast.error(`Re-audit failed: ${error.message}`);
      setAuditingLeadId(null);
    },
  });

  return {
    auditLead: auditLeadMutation.mutate,
    auditMultiple: auditMultipleMutation.mutate,
    auditPending: auditPendingMutation.mutate,
    reauditLead: reauditLeadMutation.mutate,
    isAuditing: auditLeadMutation.isPending || auditMultipleMutation.isPending || auditPendingMutation.isPending || reauditLeadMutation.isPending,
    auditingLeadId,
  };
}
