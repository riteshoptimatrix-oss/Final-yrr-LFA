"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  MessageCircle, Loader2, CheckCircle2, Clock, SkipForward, X,
  AlertCircle, ChevronLeft, ChevronRight, RefreshCw, ExternalLink,
  CheckSquare, Square, Globe, Smartphone,
  AlertTriangle, Users, Zap, Play, Square as StopIcon, Timer,
  AlertTriangle as WarningIcon, FileText, Eye, RotateCcw, Save,
  ChevronDown, ChevronUp, Hash,
} from "lucide-react";
import {
  useWhatsAppLeads, useWhatsAppStats, useGenerateMessages,
  useTrackAction,
} from "@/hooks/useWhatsAppAutomation";
import { useStartCampaign, useCampaignStatus, useStopCampaign } from "@/hooks/useWhatsAppCampaign";
import type { WhatsAppLead, GeneratedMessage } from "@/services/whatsapp-automation.service";
import type { CampaignLead } from "@/services/whatsapp-campaign.service";
import { useAuthStore } from "@/store/useAuthStore";
import { websiteClassification } from "@/services/website-classification.service";
import { whatsAppTemplateService } from "@/services/whatsapp-template.service";
import type { WhatsAppTemplatesData } from "@/services/whatsapp-template.service";

const ITEMS_PER_PAGE = 20;

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#F1F5F9', text: '#64748B', label: 'Pending' },
  prepared: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Prepared' },
  manually_sent: { bg: '#ECFDF5', text: '#059669', label: 'Sent' },
  sent: { bg: '#ECFDF5', text: '#059669', label: 'Sent' },
  skipped: { bg: '#FEF2F2', text: '#DC2626', label: 'Skipped' },
  failed: { bg: '#FEF2F2', text: '#DC2626', label: 'Failed' },
  queued: { bg: '#FEF3C7', text: '#D97706', label: 'Queued' },
  opening_whatsapp: { bg: '#DBEAFE', text: '#2563EB', label: 'Opening WhatsApp' },
  opening_chat: { bg: '#DBEAFE', text: '#2563EB', label: 'Opening Chat' },
  typing: { bg: '#E0E7FF', text: '#4F46E5', label: 'Typing' },
  sending: { bg: '#D1FAE5', text: '#059669', label: 'Sending' },
  verified: { bg: '#ECFDF5', text: '#059669', label: 'Verified' },
  completed: { bg: '#ECFDF5', text: '#059669', label: 'Completed' },
  retrying: { bg: '#FEF3C7', text: '#D97706', label: 'Retrying' },
};

const SESSION_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon?: any }> = {
  created: { bg: '#F1F5F9', text: '#64748B', label: 'Created' },
  loading: { bg: '#DBEAFE', text: '#2563EB', label: 'Loading Leads' },
  building: { bg: '#E0E7FF', text: '#4F46E5', label: 'Building Messages' },
  ready: { bg: '#FEF3C7', text: '#D97706', label: 'Ready' },
  running: { bg: '#D1FAE5', text: '#059669', label: 'Running' },
  completed: { bg: '#ECFDF5', text: '#059669', label: 'Completed' },
  failed: { bg: '#FEF2F2', text: '#DC2626', label: 'Failed' },
  stopped: { bg: '#FEF3C7', text: '#D97706', label: 'Stopped' },
  logged_out: { bg: '#FEF2F2', text: '#DC2626', label: 'Logged Out' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className || ''}`} />;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="relative bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-all min-w-0">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundColor: color }} />
      <div className="relative flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10` }}>
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 leading-none tracking-tight">{value}</p>
          <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatETA(seconds: number | null): string {
  if (seconds === null) return 'Calculating...';
  if (seconds < 60) return `~${Math.round(seconds)}s remaining`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `~${mins}m ${secs}s remaining`;
}

export default function WhatsAppAutomationPage() {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [activityLog, setActivityLog] = useState<Array<{ leadId: string; companyName: string; status: string; timestamp: number; error?: string }>>([]);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);
  const [lastStoppedAt, setLastStoppedAt] = useState<number | null>(null);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesData, setTemplatesData] = useState<WhatsAppTemplatesData | null>(null);
  const [websiteMessage, setWebsiteMessage] = useState('');
  const [noWebsiteMessage, setNoWebsiteMessage] = useState('');
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingNoWebsite, setSavingNoWebsite] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'website' | 'no_website' | null>(null);
  const websiteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noWebsiteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const trackActionMut = useTrackAction();
  const generateMsgMut = useGenerateMessages();
  const startCampaignMut = useStartCampaign();
  const stopCampaignMut = useStopCampaign();

  const { data: campaignData, refetch: refetchCampaignStatus } = useCampaignStatus(
    sessionId,
    !manualMode && !!sessionId
  );

  const apiParams = useMemo(() => ({
    page: String(page), limit: String(ITEMS_PER_PAGE),
  }), [page]);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppLeads(apiParams);
  const { data: stats } = useWhatsAppStats();

  const leads: WhatsAppLead[] = useMemo(() => data?.data || [], [data]);
  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const selectedLeads = useMemo(() => leads.filter(l => selectedIds.has(l.id)), [leads, selectedIds]);

  const isCampaignRunning = campaignData && campaignData.status === 'running';
  const isCampaignComplete = campaignData && (campaignData.status === 'completed' || campaignData.status === 'failed' || campaignData.status === 'stopped' || campaignData.status === 'logged_out');
  const isCampaignStopped = campaignData && campaignData.status === 'stopped';
  const isCampaignPending = campaignData && campaignData.status === 'pending';
  const isCampaignLoading = campaignData && campaignData.status === 'loading';
  const isCampaignBuilding = campaignData && campaignData.status === 'building';

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === leads.length) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(leads.map(l => l.id)));
  }, [leads, selectedIds]);

  const addLog = useCallback((leadId: string, companyName: string, status: string, error?: string) => {
    setActivityLog(prev => [{ leadId, companyName, status, timestamp: Date.now(), error }, ...prev]);
  }, []);

  const { user } = useAuthStore();

  const handleStartCampaign = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { setErrorMessage('Select at least one lead'); return; }

    setErrorMessage(null);
    setSessionId(null);
    setManualMode(false);
    setActivityLog([]);

    try {
      const result = await startCampaignMut.mutateAsync(ids);
      setSessionId(result.sessionId);
    } catch (err: unknown) {
      let errorMsg = 'Failed to start campaign';
      
      if (err instanceof Error) {
        errorMsg = err.message;
        
        if ('code' in err && typeof (err as any).code === 'string') {
          const code = (err as any).code;
          switch (code) {
            case 'DISPLAY_NOT_AVAILABLE':
              errorMsg = 'WhatsApp sender error: Cannot access desktop display. This feature requires a graphical environment (X11 or Wayland).';
              break;
            case 'BROWSER_INIT_FAILED':
              errorMsg = 'Failed to initialize WhatsApp browser. Please check browser settings.';
              break;
            case 'SENDER_INIT_FAILED':
              errorMsg = 'WhatsApp sender initialization failed. Please try again.';
              break;
            case 'AI_SERVICE_UNAVAILABLE':
              errorMsg = 'AI service is currently unavailable. Please try again in a moment.';
              break;
            case 'CAMPAIGN_START_FAILED':
              errorMsg = `Campaign failed to start: ${err.message}`;
              break;
          }
        }
      }
      
      setErrorMessage(errorMsg);
    }
  }, [selectedIds, startCampaignMut]);

  const handleStopCampaign = useCallback(async () => {
    if (!sessionId) {
      setStopError('No active campaign found');
      return;
    }
    
    if (isStopping) {
      setStopError('Stop request already in progress');
      return;
    }
    
    setIsStopping(true);
    setStopError(null);
    
    try {
      await stopCampaignMut.mutateAsync(sessionId);
      setShowStopConfirmation(false);
      setLastStoppedAt(Date.now());
      setErrorMessage(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop campaign';
      setStopError(errorMsg);
      setErrorMessage(errorMsg);
      setShowStopConfirmation(false);
    } finally {
      setIsStopping(false);
    }
  }, [sessionId, stopCampaignMut, isStopping]);

  const handleConfirmStop = useCallback(() => {
    setShowStopConfirmation(true);
    setStopError(null);
  }, []);

  const handleReset = useCallback(() => {
    setSessionId(null);
    setErrorMessage(null);
    setManualMode(false);
    setMessages([]);
    setFlowIndex(0);
    setActivityLog([]);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const data = await whatsAppTemplateService.getTemplates();
      setTemplatesData(data);
      setWebsiteMessage(data.website.message);
      setNoWebsiteMessage(data.no_website.message);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const insertPlaceholder = useCallback((type: 'website' | 'no_website', placeholder: string) => {
    const ref = type === 'website' ? websiteTextareaRef : noWebsiteTextareaRef;
    const setter = type === 'website' ? setWebsiteMessage : setNoWebsiteMessage;
    const current = type === 'website' ? websiteMessage : noWebsiteMessage;

    const textarea = ref.current;
    if (!textarea) {
      setter(prev => prev + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = current.substring(0, start) + placeholder + current.substring(end);
    setter(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + placeholder.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [websiteMessage, noWebsiteMessage]);

  const handleSaveWebsite = useCallback(async () => {
    setSavingWebsite(true);
    setTemplateError(null);
    setTemplateSuccess(null);
    try {
      const trimmed = websiteMessage.trim();
      if (!trimmed) {
        setTemplateError('Message cannot be empty');
        setSavingWebsite(false);
        return;
      }
      const result = await whatsAppTemplateService.updateWebsiteTemplate(trimmed);
      setWebsiteMessage(result.data.message);
      setTemplateSuccess('✅ Website Template Saved Successfully');
      setTimeout(() => setTemplateSuccess(null), 3000);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSavingWebsite(false);
    }
  }, [websiteMessage]);

  const handleSaveNoWebsite = useCallback(async () => {
    setSavingNoWebsite(true);
    setTemplateError(null);
    setTemplateSuccess(null);
    try {
      const trimmed = noWebsiteMessage.trim();
      if (!trimmed) {
        setTemplateError('Message cannot be empty');
        setSavingNoWebsite(false);
        return;
      }
      const result = await whatsAppTemplateService.updateNoWebsiteTemplate(trimmed);
      setNoWebsiteMessage(result.data.message);
      setTemplateSuccess('✅ No-Website Template Saved Successfully');
      setTimeout(() => setTemplateSuccess(null), 3000);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSavingNoWebsite(false);
    }
  }, [noWebsiteMessage]);

  const handleResetTemplates = useCallback(async () => {
    setResetting(true);
    setTemplateError(null);
    try {
      const data = await whatsAppTemplateService.resetTemplates();
      setWebsiteMessage(data.website.message);
      setNoWebsiteMessage(data.no_website.message);
      setTemplateSuccess('✅ Templates reset to defaults');
      setTimeout(() => setTemplateSuccess(null), 3000);
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Failed to reset templates');
    } finally {
      setResetting(false);
    }
  }, []);

  const PLACEHOLDER_CHIPS = [
    '{{businessName}}', '{{ownerName}}', '{{companyName}}',
    '{{city}}', '{{area}}', '{{state}}',
    '{{website}}', '{{phone}}', '{{category}}',
    '{{rating}}', '{{leadScore}}',
    '{{senderName}}', '{{senderPhone}}', '{{senderEmail}}', '{{senderWebsite}}',
    '{{currentDate}}', '{{currentTime}}',
  ];

  const [previewRendered, setPreviewRendered] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = useCallback(async (type: 'website' | 'no_website') => {
    const message = type === 'website' ? websiteMessage : noWebsiteMessage;
    if (!message.trim()) {
      setTemplateError('Cannot preview an empty template');
      return;
    }
    setPreviewLoading(true);
    setPreviewRendered(null);
    setPreviewType(type);
    try {
      const rendered = await whatsAppTemplateService.previewTemplate(type, message);
      setPreviewRendered(rendered);
    } catch {
      setPreviewRendered(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [websiteMessage, noWebsiteMessage]);

    const handleManualGenerate = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { setErrorMessage('Select at least one lead'); return; }

    setErrorMessage(null);
    setMessages([]);
    setFlowIndex(0);
    setActivityLog([]);
    setManualMode(true);

    try {
      const campaignId = `manual_${Math.random().toString(36).substr(2, 9)}`;
      const userId = user?.id || 'admin';

      const result = await generateMsgMut.mutateAsync({
        leadIds: ids,
        campaignId,
        userId,
      });

      for (const s of result.skipped) {
        addLog(s.leadId, s.companyName, 'skipped', s.reason);
      }
      
      if (result.data.length === 0) {
        setErrorMessage(`No valid leads to process. ${result.skippedCount} leads were skipped due to invalid phone numbers or other issues. Check the activity log for details.`);
        return;
      }
      
      setMessages(result.data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate messages');
    }
  }, [selectedIds, generateMsgMut, addLog, user]);

  const handleOpenWhatsApp = useCallback((msg: GeneratedMessage) => {
    window.open(msg.whatsappUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const handleMarkSent = useCallback(async () => {
    const msg = messages[flowIndex];
    if (!msg) return;

    try {
      await trackActionMut.mutateAsync({
        leadId: msg.leadId,
        action: 'manually_sent',
        notes: 'Sent manually via WhatsApp Web link',
      });
    } catch { }

    addLog(msg.leadId, msg.companyName, 'manually_sent');

    if (flowIndex + 1 < messages.length) {
      setFlowIndex(flowIndex + 1);
    } else {
      setFlowIndex(messages.length);
    }
  }, [flowIndex, messages, trackActionMut, addLog]);

  const handleSkip = useCallback(async () => {
    const msg = messages[flowIndex];
    if (!msg) return;

    try {
      await trackActionMut.mutateAsync({ leadId: msg.leadId, action: 'skipped', notes: 'Skipped by user' });
    } catch { }

    addLog(msg.leadId, msg.companyName, 'skipped');

    if (flowIndex + 1 < messages.length) {
      setFlowIndex(flowIndex + 1);
    } else {
      setFlowIndex(messages.length);
    }
  }, [flowIndex, messages, trackActionMut, addLog]);

  useEffect(() => {
    if (campaignData?.leads) {
      for (const lead of campaignData.leads) {
        const existingLog = activityLog.find(l => l.leadId === lead.leadId);
        if (!existingLog && (lead.status === 'completed' || lead.status === 'failed')) {
          addLog(lead.leadId, lead.companyName, lead.status, lead.error || undefined);
        }
      }
    }
  }, [campaignData?.leads, addLog, activityLog]);

  const currentMsg = messages[flowIndex];
  const hasActiveManualFlow = manualMode && messages.length > 0 && flowIndex < messages.length;

  const sentCount = campaignData?.completed ?? activityLog.filter(a => a.status === 'completed' || a.status === 'manually_sent').length;
  const failedCount = campaignData?.failed ?? activityLog.filter(a => a.status === 'failed').length;
  const progressPercent = campaignData ? Math.round((campaignData.processed / campaignData.totalLeads) * 100) : 0;

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 py-5">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">WhatsApp Automation</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {isCampaignRunning ? 'Campaign in progress - fully automatic' : 'Select leads and start automatic campaign'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isCampaignRunning || isCampaignPending || isCampaignLoading || isCampaignBuilding ? (
              <button onClick={handleConfirmStop}
                disabled={stopCampaignMut.isPending || isStopping}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all">
                {stopCampaignMut.isPending || isStopping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <StopIcon className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {stopCampaignMut.isPending || isStopping ? 'Stopping...' : 'Stop Campaign'}
              </button>
            ) : sessionId && isCampaignComplete ? (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-semibold hover:bg-slate-200 transition-all">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                Start New Campaign
              </button>
            ) : hasActiveManualFlow ? (
              <button onClick={handleReset}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-semibold hover:bg-slate-200 transition-all">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                Reset Flow
              </button>
            ) : (
              <>
                <button onClick={handleStartCampaign} disabled={selectedIds.size === 0 || startCampaignMut.isPending}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
                  {startCampaignMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Play className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {startCampaignMut.isPending ? 'Starting...' : 'Start Automatic Campaign'}
                </button>
                <button onClick={handleManualGenerate} disabled={selectedIds.size === 0 || generateMsgMut.isPending}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-500 text-white text-[12px] font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all">
                  {generateMsgMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Zap className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {generateMsgMut.isPending ? 'Generating...' : 'Manual Mode'}
                </button>
                <button onClick={() => refetch()} disabled={isRefetching}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} strokeWidth={2} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-5">
          <StatCard icon={Users} label="Total Leads" value={stats?.total || 0} color="#6366F1" />
          <StatCard icon={Globe} label="With Website" value={stats?.withWebsite || 0} color="#3B82F6" />
          <StatCard icon={CheckCircle2} label="Sent" value={stats?.manually_sent || 0} color="#10B981" />
          <StatCard icon={Clock} label="Prepared" value={stats?.prepared || 0} color="#F59E0B" />
          <StatCard icon={AlertTriangle} label="Skipped" value={(stats?.skipped || 0) + (stats?.failed || 0)} color="#EF4444" />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2.5 mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" strokeWidth={2} />
            <p className="text-[12.5px] text-red-700 flex-1">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}

        {showStopConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
                <WarningIcon className="h-5 w-5 text-amber-500 shrink-0" strokeWidth={2} />
                <h2 className="text-[14px] font-bold text-slate-900">Stop Current Campaign?</h2>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-slate-600">
                  The current WhatsApp campaign will stop after the current lead finishes processing. Remaining leads will stay pending and can be resumed later.
                </p>
              </div>
              <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-200 justify-end">
                <button onClick={() => setShowStopConfirmation(false)}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleStopCampaign} disabled={stopCampaignMut.isPending}
                  className="h-9 px-4 rounded-lg bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  {stopCampaignMut.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <StopIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  {stopCampaignMut.isPending ? 'Stopping...' : 'Stop Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Message Templates Section */}
        <div className="mb-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setTemplatesOpen(!templatesOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-slate-500" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-slate-800">WhatsApp Message Templates</span>
              {!templatesLoading && templatesData && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Customize messages for Website & No-Website businesses
                </span>
              )}
            </div>
            {templatesOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" strokeWidth={2} />
            )}
          </button>

          {templatesOpen && (
            <div className="border-t border-slate-100 p-4">
              {templateSuccess && (
                <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2} />
                  <p className="text-[12px] text-emerald-700 flex-1">{templateSuccess}</p>
                </div>
              )}

              {templateError && (
                <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" strokeWidth={2} />
                  <p className="text-[12px] text-red-700 flex-1">{templateError}</p>
                  <button onClick={() => setTemplateError(null)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}

              {templatesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Website Template Editor */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50/50 border-b border-slate-200">
                      <Globe className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                      <span className="text-[13px] font-semibold text-slate-800">✅ Website Business Template</span>
                    </div>
                    <div className="p-4">
                      <textarea
                        ref={websiteTextareaRef}
                        value={websiteMessage}
                        onChange={(e) => setWebsiteMessage(e.target.value)}
                        className="w-full h-36 px-3 py-2.5 text-[12px] text-slate-800 border border-slate-200 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-sans leading-relaxed"
                        placeholder="Enter your WhatsApp message template for businesses with a website..."
                      />
                      <div className="flex items-center justify-between mt-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                          <span className={`text-[11px] font-mono ${websiteMessage.length > 4000 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                            {websiteMessage.length} / 4000
                          </span>
                          {websiteMessage.length > 4000 && (
                            <span className="text-[10px] text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                              Exceeds WhatsApp limit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreview('website')}
                            disabled={previewLoading}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                          >
                            {previewLoading && previewType === 'website' ? (
                              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                              <Eye className="h-3 w-3" strokeWidth={2} />
                            )}
                            Preview
                          </button>
                          <button
                            onClick={handleResetTemplates}
                            disabled={resetting}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} strokeWidth={2} />
                            Reset to Default
                          </button>
                          <button
                            onClick={handleSaveWebsite}
                            disabled={savingWebsite || !websiteMessage.trim()}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
                          >
                            {savingWebsite ? (
                              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                              <Save className="h-3 w-3" strokeWidth={2} />
                            )}
                            Save Template
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PLACEHOLDER_CHIPS.map((ph) => (
                          <button
                            key={ph}
                            onClick={() => insertPlaceholder('website', ph)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-mono hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-transparent transition-all"
                          >
                            {ph}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* No Website Template Editor */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/50 border-b border-slate-200">
                      <Smartphone className="h-4 w-4 text-amber-600" strokeWidth={2} />
                      <span className="text-[13px] font-semibold text-slate-800">❌ No Website Business Template</span>
                    </div>
                    <div className="p-4">
                      <textarea
                        ref={noWebsiteTextareaRef}
                        value={noWebsiteMessage}
                        onChange={(e) => setNoWebsiteMessage(e.target.value)}
                        className="w-full h-36 px-3 py-2.5 text-[12px] text-slate-800 border border-slate-200 rounded-lg resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-sans leading-relaxed"
                        placeholder="Enter your WhatsApp message template for businesses without a website..."
                      />
                      <div className="flex items-center justify-between mt-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
                          <span className={`text-[11px] font-mono ${noWebsiteMessage.length > 4000 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                            {noWebsiteMessage.length} / 4000
                          </span>
                          {noWebsiteMessage.length > 4000 && (
                            <span className="text-[10px] text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                              Exceeds WhatsApp limit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreview('no_website')}
                            disabled={previewLoading}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                          >
                            {previewLoading && previewType === 'no_website' ? (
                              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                              <Eye className="h-3 w-3" strokeWidth={2} />
                            )}
                            Preview
                          </button>
                          <button
                            onClick={handleResetTemplates}
                            disabled={resetting}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                          >
                            <RotateCcw className={`h-3 w-3 ${resetting ? 'animate-spin' : ''}`} strokeWidth={2} />
                            Reset to Default
                          </button>
                          <button
                            onClick={handleSaveNoWebsite}
                            disabled={savingNoWebsite || !noWebsiteMessage.trim()}
                            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
                          >
                            {savingNoWebsite ? (
                              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                              <Save className="h-3 w-3" strokeWidth={2} />
                            )}
                            Save Template
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PLACEHOLDER_CHIPS.map((ph) => (
                          <button
                            key={ph}
                            onClick={() => insertPlaceholder('no_website', ph)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-mono hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-transparent transition-all"
                          >
                            {ph}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewType(null)}>
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-500" strokeWidth={2} />
                  <h2 className="text-[14px] font-bold text-slate-800">
                    Preview — {previewType === 'website' ? '✅ Website Business' : '❌ No Website Business'}
                  </h2>
                </div>
                <button onClick={() => setPreviewType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto max-h-[60vh]">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" strokeWidth={2} />
                    </div>
                  ) : (
                    <pre className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {previewRendered || 'Preview not available'}
                    </pre>
                  )}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-[11px] text-blue-700 font-medium mb-1.5">Sample Lead Data Used for Preview</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-blue-600">
                    <span>Business: ABC Gym</span>
                    <span>Owner: Rahul Sharma</span>
                    <span>City: Ahmedabad</span>
                    <span>Area: SG Highway</span>
                    <span>State: Gujarat</span>
                    <span>Website: https://abcgym.com</span>
                    <span>Phone: +91 98765 43210</span>
                    <span>Category: Fitness Center</span>
                    <span>Rating: 4.5</span>
                    <span>Lead Score: 92</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200">
                <button
                  onClick={() => setPreviewType(null)}
                  className="h-9 px-5 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-semibold hover:bg-slate-200 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {campaignData && !manualMode && (
          <div className="mb-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {isCampaignRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" strokeWidth={2} />
                ) : isCampaignComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={2} />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" strokeWidth={2} />
                )}
                <div>
                  <span className="text-[14px] font-bold text-slate-700">
                    Campaign {SESSION_STATUS_CONFIG[campaignData.status]?.label || campaignData.status}
                  </span>
                  {campaignData.currentLead && isCampaignRunning && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Processing: {campaignData.leads.find((l: CampaignLead) => l.leadId === campaignData.currentLead)?.companyName || campaignData.currentLead}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" strokeWidth={2} />
                  Sent: {campaignData.completed}
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
                  Failed: {campaignData.failed}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />
                  {formatETA(campaignData.eta)}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Progress: {campaignData.processed} / {campaignData.totalLeads} leads</span>
              <span>Elapsed: {formatDuration(campaignData.elapsedSeconds)}</span>
            </div>
          </div>
        )}

        {campaignData && !manualMode && campaignData.leads.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Live Queue Status</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {campaignData.leads.map((lead: CampaignLead) => (
                <div key={lead.leadId} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  lead.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                  lead.status === 'failed' ? 'border-red-200 bg-red-50/50' :
                  ['opening_whatsapp', 'opening_chat', 'typing', 'sending'].includes(lead.status) ? 'border-blue-300 bg-blue-50/50 shadow-sm' :
                  'border-slate-200 bg-white'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-slate-800 truncate">{lead.companyName}</span>
                      {lead.messageType === 'Website' ? (
                        <Globe className="h-3 w-3 text-blue-500 shrink-0" strokeWidth={2} />
                      ) : (
                        <Smartphone className="h-3 w-3 text-amber-500 shrink-0" strokeWidth={2} />
                      )}
                      {lead.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" strokeWidth={2} />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">{lead.phone || 'No phone'}</span>
                      {lead.error && <span className="text-[10px] text-red-500 truncate">— {lead.error}</span>}
                    </div>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentMsg && manualMode && (
          <div className="mb-5 bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                    Lead {flowIndex + 1} of {messages.length} (Manual Mode)
                  </span>
                  <h3 className="text-[14px] font-bold text-slate-800">{currentMsg.companyName}</h3>
                  {currentMsg.hasWebsite ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                      <Globe className="h-3 w-3" strokeWidth={2} /> Website
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                      <Smartphone className="h-3 w-3" strokeWidth={2} /> No Website
                    </span>
                  )}
                </div>
                <span className="text-[12px] font-mono text-slate-500">{currentMsg.normalizedPhone}</span>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4 max-h-48 overflow-y-auto">
                <pre className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{currentMsg.message}</pre>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => handleOpenWhatsApp(currentMsg)}
                  className="flex items-center gap-2 h-10 px-5 rounded-lg bg-green-500 text-white text-[13px] font-semibold hover:bg-green-600 transition-all shadow-sm">
                  <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  Open WhatsApp
                </button>
                <button onClick={handleMarkSent}
                  className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-all shadow-sm">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  Mark as Sent
                </button>
                <button onClick={handleSkip}
                  className="flex items-center gap-2 h-10 px-5 rounded-lg bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-all">
                  <SkipForward className="h-4 w-4" strokeWidth={2} />
                  Skip
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Manual mode: Open WhatsApp, send the message, then click "Mark as Sent"
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                {selectedIds.size === leads.length && leads.length > 0 ? (
                  <CheckSquare className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Square className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
              <span className="text-[12px] font-semibold text-slate-600">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${totalItems} total leads`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} disabled={isRefetching}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 text-slate-500 text-[11px] font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
                <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} strokeWidth={2} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="h-10 w-10 text-slate-300 mb-3" strokeWidth={1.2} />
              <p className="text-[13px] text-slate-500">No leads with phone numbers found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                const campaignLead = campaignData?.leads.find((l: CampaignLead) => l.leadId === lead.id);
                return (
                  <div key={lead.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                    <button onClick={() => toggleSelect(lead.id)} className="text-slate-400 hover:text-slate-600 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" strokeWidth={2} />
                      ) : (
                        <Square className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-800 truncate">{lead.companyName}</span>
                        <StatusBadge status={campaignLead?.status || lead.whatsappOutreach?.status || 'pending'} />
                        {websiteClassification.classify(lead.website).hasWebsite ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-semibold">
                            <Globe className="h-2.5 w-2.5" strokeWidth={2} /> WEB
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-semibold">
                            <Smartphone className="h-2.5 w-2.5" strokeWidth={2} /> NO WEB
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono">{lead.normalizedPhone || lead.phone}</span>
                        {lead.city && <span className="text-[11px] text-slate-400">• {lead.city}</span>}
                        {lead.category && <span className="text-[11px] text-slate-400">• {lead.category}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronLeft className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                  className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>

        {activityLog.length > 0 && !campaignData && (
          <div className="mt-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider">Activity Log</h3>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
              {activityLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-2">
                  {log.status === 'completed' || log.status === 'manually_sent' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" strokeWidth={2} />
                  ) : log.status === 'skipped' ? (
                    <SkipForward className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2} />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" strokeWidth={2} />
                  )}
                  <span className="text-[12px] text-slate-700 font-medium min-w-0 truncate">{log.companyName}</span>
                  <span className="text-[11px] text-slate-500">{log.status === 'completed' || log.status === 'manually_sent' ? '✓ Sent' : log.status}</span>
                  {log.error && <span className="text-[11px] text-red-500 truncate">— {log.error}</span>}
                  <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {campaignData && isCampaignComplete && !manualMode && (
          <div className="mt-5 flex items-center justify-center gap-6 p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" strokeWidth={2} />
              <span className="text-[13px] font-semibold text-green-800">
                Campaign {campaignData.status === 'completed' ? 'Completed' : campaignData.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-green-700">
              <span>Sent: {campaignData.completed}</span>
              <span>Failed: {campaignData.failed}</span>
              <span>Duration: {formatDuration(campaignData.elapsedSeconds)}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
