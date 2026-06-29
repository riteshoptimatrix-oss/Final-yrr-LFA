import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService, ReportProgress } from '@/services/report.service';
import { Lead } from '@/types/index';

export function useReportGeneration(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ReportProgress | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statusQuery = useQuery({
    queryKey: ['report-status', leadId],
    queryFn: () => reportService.getReportStatus(leadId!),
    enabled: !!leadId,
    staleTime: 30000,
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      if (data?.report?.generating || data?.isQueued) return 2000;
      return false;
    },
    refetchOnWindowFocus: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => reportService.generateReport(leadId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-status', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reportService.deleteReport(leadId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-status', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setProgress(null);
    },
  });

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const report = statusQuery.data?.data?.report ?? null;
  const isQueued = statusQuery.data?.data?.isQueued ?? false;
  const isGenerating = report?.generating || isQueued || generateMutation.isPending;
  const isGenerated = report?.generated ?? false;

  const progressStage = report?.progress || progress;

  const generate = useCallback(async () => {
    if (!leadId) return;
    setProgress({ stage: 'initializing', percent: 0, message: 'Starting report generation...' });
    await generateMutation.mutateAsync();
  }, [leadId, generateMutation]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

  const viewReport = useCallback(async () => {
    if (!leadId) return;
    try {
      const blob = await reportService.downloadReport(leadId);
      reportService.viewPdfInTab(blob);
    } catch {
      const url = apiBaseUrl ? `${apiBaseUrl}/reports/view/${leadId}` : `/api/v1/reports/view/${leadId}`;
      window.open(url, '_blank');
    }
  }, [leadId, apiBaseUrl]);

  const downloadReport = useCallback(async () => {
    if (!leadId) return;
    try {
      const blob = await reportService.downloadReport(leadId);
      reportService.downloadPdf(blob, `audit_report_${leadId}.pdf`);
    } catch {
      const url = apiBaseUrl ? `${apiBaseUrl}/reports/download/${leadId}` : `/api/v1/reports/download/${leadId}`;
      window.open(url, '_blank');
    }
  }, [leadId, apiBaseUrl]);

  const deleteReport = useCallback(async () => {
    if (!leadId) return;
    await deleteMutation.mutateAsync();
  }, [leadId, deleteMutation]);

  return {
    report,
    progress: progressStage,
    isGenerating,
    isGenerated,
    isQueued,
    generate,
    viewReport,
    downloadReport,
    deleteReport,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
  };
}

export function useReportGenerationForLead(lead: Lead | null) {
  const leadId = lead?.id;
  return useReportGeneration(leadId);
}
