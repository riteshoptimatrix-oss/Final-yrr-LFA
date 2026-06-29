import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { Lead } from "@/types/index";
import { useLeadDetails } from "@/hooks/useLeads";
import { useLeadOutreach, useGenerateOutreach, useUpdateOutreachStatus } from "@/hooks/useOutreach";
import { useLeadAIStatus, useRefreshAnalysis } from "@/hooks/useMegaAI";
import { useReportGenerationForLead } from "@/hooks/useReport";
import { useWebsiteIntelligence } from "@/hooks/useWebsiteIntelligence";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/utils/api-client";
import { leadService } from "@/services/lead.service";
import { websiteClassification } from "@/services/website-classification.service";
import { io, Socket } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  Building2,
  ExternalLink,
  Calendar,
  Search,
  Map,
  Hash,
  Clock,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Quote,
  Smartphone,
  Shield,
  TrendingUp,
  Layout,
  FileText,
  Award,
  AlertTriangle,
  ThumbsUp,
  Zap,
  BarChart3,
  Target,
  Lightbulb,
  DollarSign,
  Gauge,
  SendHorizonal,
  File,
  MessageSquare,
  MailOpen,
  ClipboardList,
  RefreshCw,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  Server,
  Activity,
  Eye,
  Layers,
  Wifi,
  Lock,
  Info,
} from "lucide-react";

export interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getScoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "High Potential";
  if (score >= 50) return "Medium Potential";
  return "Low Potential";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function DetailRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | undefined | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center gap-1"
          >
            {value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <p className="text-sm break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function DetailRowWithFallback({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
  href?: string;
}) {
  const displayValue = value !== null && value !== undefined ? String(value) : undefined;
  if (displayValue) {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
        <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center gap-1"
            >
              {displayValue}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <p className="text-sm break-words">{displayValue}</p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-muted-foreground italic">Not Available</p>
      </div>
    </div>
  );
}

function BusinessEmailSection({ lead }: { lead: Lead }) {
  const [discovering, setDiscovering] = useState(false);
  const [localEmails, setLocalEmails] = useState(lead.discoveredEmails);
  const [localPrimary, setLocalPrimary] = useState(lead.primaryEmail);
  const [localStatus, setLocalStatus] = useState(lead.emailDiscoveryStatus);
  const [localError, setLocalError] = useState(lead.emailDiscoveryError);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTriggeredRef = useRef(false);

  const emails = localEmails || lead.discoveredEmails;
  const primary = localPrimary || lead.primaryEmail;
  const status = localStatus || lead.emailDiscoveryStatus;
  const errorMsg = localError || lead.emailDiscoveryError;

  const needsDiscovery = (websiteClassification.classify(lead.website).hasWebsite) && !lead.email && (status === 'pending' || !status);

  useEffect(() => {
    if (!needsDiscovery || autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;
    handleDiscoverAsync();
  }, [lead.id]);

  useEffect(() => {
    const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const url = configuredUrl ? configuredUrl.replace(/\/$/, '') : window.location.origin;

    const socket = io(url, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('email:discovery:update', (event: { leadId: string; data: { status: string; primaryEmail?: string; emailCount?: number; error?: string } }) => {
      if (event.leadId !== lead.id) return;
      if (event.data.status === 'completed') {
        leadService.getEmailDiscoveryResult(lead.id!).then((res) => {
          if (res?.data) {
            setLocalEmails(res.data.discoveredEmails);
            setLocalPrimary(res.data.primaryEmail);
            setLocalStatus('completed');
            setDiscovering(false);
          }
        }).catch(() => { });
      } else if (event.data.status === 'failed') {
        setLocalStatus('failed');
        setLocalError(event.data.error || 'Discovery failed');
        setDiscovering(false);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [lead.id]);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await leadService.getEmailDiscoveryResult(lead.id!);
        if (res?.data) {
          if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'skipped') {
            setLocalEmails(res.data.discoveredEmails);
            setLocalPrimary(res.data.primaryEmail);
            setLocalStatus(res.data.status);
            setLocalError(res.data.error);
            setDiscovering(false);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }
      } catch {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    }, 2000);
  };

  const handleDiscoverAsync = async () => {
    if (!lead.id) return;
    setDiscovering(true);
    setLocalStatus('scanning');
    try {
      await leadService.discoverEmailAsync(lead.id);
      startPolling();
    } catch {
      setLocalStatus('failed');
      setLocalError('Discovery failed');
      setDiscovering(false);
    }
  };

  const handleDiscoverSync = async () => {
    if (!lead.id) return;
    setDiscovering(true);
    try {
      const result = await leadService.discoverEmail(lead.id);
      if (result?.data) {
        if (result.data.status === 'scanning') {
          setLocalStatus('scanning');
          startPolling();
        } else {
          setLocalEmails(result.data.discoveredEmails);
          setLocalPrimary(result.data.primaryEmail);
          setLocalStatus('completed');
          setDiscovering(false);
        }
      }
    } catch {
      setLocalStatus('failed');
      setLocalError('Discovery failed');
      setDiscovering(false);
    }
  };

  const isScanning = status === 'scanning' || status === 'pending' || discovering;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isSkipped = status === 'skipped';
  const hasEmails = emails && emails.length > 0;

  return (
    <div className="border-t border-border/40 pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-blue-500" />
          Business Email Discovery
        </p>
        {!isScanning && (
          <button
            onClick={handleDiscoverSync}
            className="flex items-center gap-1 h-6 px-2 rounded-md border border-border/40 text-[10px] font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            {isFailed ? 'Retry' : 'Scan'}
          </button>
        )}
      </div>

      {isScanning ? (
        <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-400">Searching Business Email...</p>
        </div>
      ) : isSkipped ? (
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <p className="text-xs text-muted-foreground">Email discovery skipped — social or directory website</p>
        </div>
      ) : isFailed ? (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{errorMsg || 'Email discovery failed'}</p>
        </div>
      ) : hasEmails ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
            <Mail className="h-4 w-4 text-green-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Business Email</p>
              <a
                href={`mailto:${primary || emails[0].email}`}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all inline-flex items-center gap-1"
              >
                {primary || emails[0].email}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <Badge variant="outline" className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 shrink-0">
              Primary
            </Badge>
          </div>
          {emails.length > 1 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                All discovered emails ({emails.length})
              </p>
              {emails.map((item, i) => {
                const isPrimary = item.email === (primary || emails[0].email);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {isPrimary ? (
                      <span className="h-4 w-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 ml-1.5" />
                    )}
                    <a
                      href={`mailto:${item.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {item.email}
                    </a>
                    <span className="text-muted-foreground">· {item.sourcePage}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                      {item.confidence}%
                    </Badge>
                    {isPrimary && (
                      <Badge variant="default" className="text-[7px] px-1 py-0 h-4 bg-green-600">
                        Primary
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">No Business Email Found</p>
        </div>
      )}
    </div>
  );
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'responsive' | 'intelligence' | 'sales' | 'outreach' | 'report'>('details');

  const handleWebsiteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const { data: leadDetailsData } = useLeadDetails(lead?.id ?? null);

  // Lazy hooks - only fetch data for active tab to reduce backend load
  const isOutreachTab = activeTab === 'outreach';
  const isReportTab = activeTab === 'report';
  const isIntelligenceTab = activeTab === 'intelligence';

  const { data: outreachData } = useLeadOutreach(isOutreachTab ? (lead?.id ?? undefined) : undefined);
  const {
    isGenerated: reportGenerated,
    isGenerating: reportGenerating,
    progress: reportProgress,
    generate: generateReport,
    viewReport,
    downloadReport,
  } = useReportGenerationForLead(isReportTab ? lead : null as Lead | null);
  const { analyze: analyzeIntelligence, isAnalyzing: isIntelligenceAnalyzing } = useWebsiteIntelligence();
  const generateOutreach = useGenerateOutreach();
  const updateStatus = useUpdateOutreachStatus();
  const refreshAnalysis = useRefreshAnalysis();
  const { data: aiStatusData } = useLeadAIStatus(lead?.id ?? null);
  const queryClient = useQueryClient();

  const mergedLead = useMemo(() => {
    if (leadDetailsData?.data) {
      return { ...lead, ...leadDetailsData.data } as Lead;
    }
    return lead;
  }, [lead, leadDetailsData]);

  // Audit will ONLY be triggered when user clicks a specific tab.
  // No auto-triggering on dialog open. Each tab loads independently.

  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
  }, []);

  const ai = aiStatusData;

  const renderAIProcessing = (stepField: string, stepLabel: string, completed: boolean) => {
    if (completed) return null;
    if (!ai || ai.aiStatus !== 'processing' && ai.aiStatus !== 'queued') return null;

    const stepNames = ['Responsive Audit', 'Business Intelligence', 'Sales Intelligence', 'Outreach Generation', 'Report Generation'];
    const stepIndex = stepNames.findIndex(s => stepField.startsWith(s.charAt(0).toLowerCase()));
    const isCurrentStep = ai.aiCurrentStep === stepLabel || ai.aiCurrentStep === stepNames[stepIndex];
    const stepNum = stepField === 'responsiveAuditReady' ? 1 :
      stepField === 'intelligenceReady' ? 2 :
      stepField === 'salesAIReady' ? 3 :
      stepField === 'outreachReady' ? 4 : 5;
    const stepProgress = Math.min(100, Math.max(0,
      ai.aiStatus === 'queued' ? 0 :
      ai.aiCurrentStepIndex > stepNum - 1 ? 100 :
      ai.aiCurrentStepIndex === stepNum - 1 ? 50 : 0
    ));

    return (
      <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-blue-700">AI Analysis in Progress...</span>
        </div>
        {[1, 2, 3, 4, 5].map((n) => {
          const names = ['Responsive Audit', 'Intelligence', 'Sales AI', 'Outreach', 'Report'];
          const pct = ai.aiStatus === 'queued' ? 0 :
            ai.aiCurrentStepIndex > n - 1 ? 100 :
            ai.aiCurrentStepIndex === n - 1 ? 50 : 0;
          const active = n === stepNum || (stepNum === 1 && n === 1);
          return (
            <div key={n} className="flex items-center gap-2">
              <span className={`text-[11px] font-medium w-28 shrink-0 ${active ? 'text-blue-700' : 'text-gray-400'}`}>
                {active && <Loader2 className="h-2.5 w-2.5 inline mr-1 animate-spin" />}
                {names[n - 1]}
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  pct >= 100 ? 'bg-green-400' : 'bg-blue-400'
                }`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] w-8 text-right text-gray-500">{pct}%</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!lead || !mergedLead) return null;

  const l = mergedLead;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-lg leading-tight pr-2">
              {l.companyName}
            </DialogTitle>
            <Badge
              variant="outline"
              className={`shrink-0 font-mono text-xs ${getScoreBadgeClass(l.leadScore)}`}
            >
              {l.leadScore}
            </Badge>

            {(() => {
              const ai = aiStatusData;
              if (!ai || ai.aiStatus === 'pending' || ai.aiStatus === 'failed') {
                return null;
              }
              if (ai.aiStatus === 'queued') {
                return (
                  <Badge variant="outline" className="text-[10px] h-6 shrink-0 text-amber-600 border-amber-300 bg-amber-50 animate-pulse">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Queued
                  </Badge>
                );
              }
              if (ai.aiStatus === 'processing') {
                return (
                  <div className="shrink-0 w-32">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                      <span className="text-[9px] font-medium text-blue-600 truncate">{ai.aiCurrentStep || 'Processing'}</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${ai.aiProgress || 0}%` }} />
                    </div>
                  </div>
                );
              }
              if (ai.aiStatus === 'completed') {
                return (
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-[10px] h-6 shrink-0"
                    onClick={() => l.id && refreshAnalysis.mutate(l.id)}
                    disabled={refreshAnalysis.isPending || !l.id}
                  >
                    {refreshAnalysis.isPending ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Queuing...</>
                    ) : (
                      <><RefreshCw className="h-3 w-3 mr-1" />Refresh Analysis</>
                    )}
                  </Button>
                );
              }
              return null;
            })()}

            {reportGenerated ? (
  <>
  </>
) : reportGenerating ? (
  <Button
    size="sm"
    variant="outline"
    className="text-[10px] h-6 shrink-0 text-amber-600 border-amber-300"
    disabled
  >
    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    Generating...
  </Button>
) : null} 
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">
              {l.source}
            </Badge>
            {l.qualificationLevel && (
              <Badge variant="outline" className="text-[10px]">
                {l.qualificationLevel}
              </Badge>
            )}
            {l.rating && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {l.rating}/5
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-0.5 border-b border-border/40 -mx-1 px-1 mt-1">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('responsive')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'responsive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Responsive Audit
          </button>
          {/* <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'intelligence'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Intelligence
          </button> */}
          {/* <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'sales'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Sales AI
          </button> */}
          <button
            onClick={() => setActiveTab('outreach')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'outreach'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Outreach
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-2 text-[11.5px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'report'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Report
          </button>
        </div>

        {activeTab === 'details' && (
        <>
        <div className="space-y-1">
          {(() => {
            const wc = websiteClassification.classify(l.website);
            if (wc.websiteType === 'BUSINESS_WEBSITE') {
              return (
                <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                      Professional Website Available
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {wc.domain || l.website}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        Standalone Website
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        Responsive Audit Available
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        SEO Audit Available
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        UI/UX Audit Available
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (l.website) {
              return (
                <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      No Professional Website
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5 break-all">
                      {wc.platform || wc.displayLabel}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        {wc.displayLabel}
                      </Badge>
                    </div>
                    <div className="mt-1.5">
                      <a
                        href={l.website.startsWith('http') ? l.website : `https://${l.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline break-all"
                      >
                        {l.website}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                    <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                      <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Website Development Opportunity
                      </p>
                      <p className="text-[10.5px] text-amber-700 dark:text-amber-400 mt-0.5">
                        This business does not have a standalone website and is a strong candidate for professional website development.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
                <div className="shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No Website
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    This business has no online presence detected.
                  </p>
                  <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                    <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Website Development Opportunity
                    </p>
                    <p className="text-[10.5px] text-amber-700 dark:text-amber-400 mt-0.5">
                      This business is a strong candidate for a professional website build.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
          <DetailRowWithFallback
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={l.phone}
            href={l.phone ? `tel:${l.phone}` : undefined}
          />
          <DetailRowWithFallback
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={l.email}
            href={l.email ? `mailto:${l.email}` : undefined}
          />
          {websiteClassification.classify(l.website).hasWebsite && l.website && (
            <BusinessEmailSection lead={l} />
          )}
          <DetailRowWithFallback
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={l.address}
          />
          <DetailRowWithFallback
            icon={<MapPin className="h-4 w-4" />}
            label="Street Address"
            value={l.streetAddress}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="Area"
            value={l.searchedArea || (l.sourceMetadata?.searchedArea as string)}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="City"
            value={l.searchedCity || (l.sourceMetadata?.searchedCity as string)}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="State"
            value={l.searchedState || (l.sourceMetadata?.searchedState as string)}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="Country"
            value={l.searchedCountry || (l.sourceMetadata?.searchedCountry as string)}
          />
          <DetailRowWithFallback
            icon={<Building2 className="h-4 w-4" />}
            label="Category"
            value={l.category}
          />
          <DetailRowWithFallback
            icon={<Layers className="h-4 w-4" />}
            label="Secondary Categories"
            value={l.secondaryCategories?.join(', ')}
          />
          <DetailRowWithFallback
            icon={<Eye className="h-4 w-4" />}
            label="Photos Count"
            value={l.totalPhotos !== undefined ? String(l.totalPhotos) : undefined}
          />
          <DetailRowWithFallback
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Service Options"
            value={l.serviceOptions?.join(', ')}
          />
          <DetailRowWithFallback
            icon={<Shield className="h-4 w-4" />}
            label="Owner Claimed"
            value={l.ownerClaimed !== undefined ? (l.ownerClaimed ? 'Yes' : 'No') : undefined}
          />
          <DetailRowWithFallback
            icon={<Hash className="h-4 w-4" />}
            label="Place ID"
            value={l.placeId}
          />
          {l.leadScore !== undefined ? (
            <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
              <div className="shrink-0 mt-0.5 text-muted-foreground"><Hash className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Score</p>
                <p className="text-sm break-words">
                  {l.leadScore}/100 — {getScoreLabel(l.leadScore)}
                  {l.priority && (
                    <Badge variant={l.priority === 'high' ? 'default' : l.priority === 'medium' ? 'secondary' : 'outline'} className="ml-2 text-[9px]">
                      {l.priority === 'high' ? 'High Priority' : l.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                  )}
                </p>
                {l.scoreReasoning && l.scoreReasoning.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {l.scoreReasoning.slice(0, 4).map((r: string, i: number) => (
                      <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <DetailRowWithFallback icon={<Hash className="h-4 w-4" />} label="Lead Score" value={undefined} />
          )}
          <DetailRowWithFallback
            icon={<Calendar className="h-4 w-4" />}
            label="Created"
            value={formatDate(l.createdAt)}
          />
          <DetailRowWithFallback
            icon={<Calendar className="h-4 w-4" />}
            label="Last Updated"
            value={formatDate(l.updatedAt)}
          />
          <DetailRowWithFallback
            icon={<Search className="h-4 w-4" />}
            label="Search Keyword"
            value={l.sourceMetadata?.searchedKeyword as string | undefined}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="Search Location"
            value={l.sourceMetadata?.searchedLocation as string | undefined}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="Search Country"
            value={l.sourceMetadata?.searchedCountry as string | undefined}
          />
          <DetailRowWithFallback
            icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
            label="Rating"
            value={l.rating ? `${l.rating}/5` : undefined}
          />
          <DetailRowWithFallback
            icon={<MessageSquare className="h-4 w-4" />}
            label="Total Reviews"
            value={l.reviewsCount !== undefined ? l.reviewsCount : undefined}
          />
          <DetailRowWithFallback
            icon={<Globe className="h-4 w-4" />}
            label="Business Status"
            value={l.businessStatus}
          />
          <DetailRowWithFallback
            icon={<Clock className="h-4 w-4" />}
            label="Working Hours"
            value={l.workingHours}
          />
          <DetailRowWithFallback
            icon={<MapPin className="h-4 w-4" />}
            label="Google Maps URL"
            value={l.sourceUrl}
            href={l.sourceUrl}
          />
          <DetailRowWithFallback
            icon={<Map className="h-4 w-4" />}
            label="Coordinates"
            value={l.latitude !== undefined && l.longitude !== undefined ? `${l.latitude}, ${l.longitude}` : undefined}
          />
          <DetailRowWithFallback
            icon={<Hash className="h-4 w-4" />}
            label="Pincode"
            value={l.pincode}
          />
          <DetailRowWithFallback
            icon={<Hash className="h-4 w-4" />}
            label="Plus Code"
            value={l.plusCode}
          />
          <DetailRowWithFallback
            icon={<Building2 className="h-4 w-4" />}
            label="Owner"
            value={l.ownerNames?.join(', ')}
          />
          <DetailRowWithFallback
            icon={<Server className="h-4 w-4" />}
            label="Source"
            value={l.source}
          />
          {l.hasWebsite && (
            <>
              <DetailRowWithFallback
                icon={<Globe className="h-4 w-4" />}
                label="Website Status"
                value={l.websiteReachable ? 'Reachable' : 'Unreachable'}
              />
              {l.websiteMetadata?.cms && (
                <DetailRowWithFallback
                  icon={<Server className="h-4 w-4" />}
                  label="CMS"
                  value={l.websiteMetadata.cms}
                />
              )}
              <DetailRowWithFallback
                icon={<Lock className="h-4 w-4" />}
                label="SSL Status"
                value={l.websiteMetadata?.httpsEnabled !== undefined ? (l.websiteMetadata.httpsEnabled ? 'HTTPS' : 'HTTP') : l.sslEnabled !== undefined ? (l.sslEnabled ? 'HTTPS' : 'HTTP') : undefined}
              />
              {l.websiteMetadata?.title && (
                <DetailRowWithFallback
                  icon={<FileText className="h-4 w-4" />}
                  label="Website Title"
                  value={l.websiteMetadata.title}
                />
              )}
              {l.websiteMetadata?.description && (
                <DetailRowWithFallback
                  icon={<FileText className="h-4 w-4" />}
                  label="Meta Description"
                  value={l.websiteMetadata.description}
                />
              )}
              {l.websiteMetadata?.language && (
                <DetailRowWithFallback
                  icon={<Globe className="h-4 w-4" />}
                  label="Language"
                  value={l.websiteMetadata.language}
                />
              )}
              {l.websiteMetadata?.canonicalUrl && (
                <DetailRowWithFallback
                  icon={<ExternalLink className="h-4 w-4" />}
                  label="Canonical URL"
                  value={l.websiteMetadata.canonicalUrl}
                  href={l.websiteMetadata.canonicalUrl}
                />
              )}
              {l.phones && l.phones.length > 0 && (
                <DetailRowWithFallback
                  icon={<Phone className="h-4 w-4" />}
                  label="Additional Phones"
                  value={l.phones.filter(p => p !== l.phone).join(', ') || l.phones.join(', ')}
                />
              )}
              {l.whatsappNumber && (
                <DetailRowWithFallback
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="WhatsApp"
                  value={l.whatsappNumber}
                  href={`https://wa.me/${l.whatsappNumber.replace(/\D/g, '')}`}
                />
              )}
              {l.contactPages && l.contactPages.length > 0 && (
                <DetailRowWithFallback
                  icon={<ExternalLink className="h-4 w-4" />}
                  label="Contact Page"
                  value={l.contactPages[0]}
                  href={l.contactPages[0]}
                />
              )}
              {l.websiteQuality && (
                <DetailRowWithFallback
                  icon={<Gauge className="h-4 w-4" />}
                  label="Website Quality"
                  value={`${l.websiteQuality.score}/100`}
                />
              )}
              {l.websiteQuality?.issues && l.websiteQuality.issues.length > 0 && (
                <DetailRowWithFallback
                  icon={<AlertTriangle className="h-4 w-4" />}
                  label="Quality Issues"
                  value={l.websiteQuality.issues.join(', ')}
                />
              )}
              {(l.socialLinks?.facebook || l.socialLinks?.instagram || l.socialLinks?.linkedin || l.socialLinks?.youtube || l.socialLinks?.twitter || l.socialLinks?.pinterest || l.socialLinks?.whatsapp) && (
                <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
                  <div className="shrink-0 mt-0.5 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Social Links</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {l.socialLinks.facebook && (
                        <a href={l.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Facebook</a>
                      )}
                      {l.socialLinks.instagram && (
                        <a href={l.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Instagram</a>
                      )}
                      {l.socialLinks.linkedin && (
                        <a href={l.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">LinkedIn</a>
                      )}
                      {l.socialLinks.youtube && (
                        <a href={l.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">YouTube</a>
                      )}
                      {l.socialLinks.twitter && (
                        <a href={l.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Twitter/X</a>
                      )}
                      {l.socialLinks.pinterest && (
                        <a href={l.socialLinks.pinterest} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Pinterest</a>
                      )}
                      {l.socialLinks.whatsapp && (
                        <a href={l.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">WhatsApp</a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {l.enrichmentStatus && (
                <div className="flex items-start gap-3 py-2.5 border-b border-border/40">
                  <div className="shrink-0 mt-0.5 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrichment Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={
                        l.enrichmentStatus === 'completed' ? 'default' :
                        l.enrichmentStatus === 'running' ? 'secondary' :
                        l.enrichmentStatus === 'failed' ? 'destructive' : 'outline'
                      } className="text-[10px]">
                        {l.enrichmentStatus}
                      </Badge>
                      {l.enrichmentStatus === 'running' && l.enrichmentProgress !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                          <span className="text-[10px] text-muted-foreground">{l.enrichmentProgress}%</span>
                        </div>
                      )}
                      {l.enrichmentCurrentStep && (
                        <span className="text-[10px] text-muted-foreground">{l.enrichmentCurrentStep}</span>
                      )}
                    </div>
                    {l.enrichmentError && (
                      <p className="text-[10px] text-red-500 mt-1">{l.enrichmentError}</p>
                    )}
                    {l.enrichmentCompletedAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Completed: {formatDate(l.enrichmentCompletedAt)}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {(l.finalConfidence !== undefined || l.validationStatus || l.aiQuality) && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <BrainCircuit className="h-4 w-4 text-indigo-500" />
              AI Validation
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {l.finalConfidence !== undefined && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Confidence</p>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{l.finalConfidence}%</p>
                </div>
              )}
              {l.categoryConfidence !== undefined && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">Category</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{l.categoryConfidence}%</p>
                </div>
              )}
              {l.locationConfidence !== undefined && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Location</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{l.locationConfidence}%</p>
                </div>
              )}
              {l.relevanceScore !== undefined && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Relevance</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{l.relevanceScore}%</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {l.validationStatus && (
                <Badge variant={l.validationStatus === 'validated' ? 'default' : l.validationStatus === 'needs-review' ? 'secondary' : 'destructive'}>
                  {l.validationStatus}
                </Badge>
              )}
              {l.aiQuality && (
                <Badge variant={l.aiQuality === 'excellent' ? 'default' : l.aiQuality === 'good' ? 'secondary' : 'outline'}>
                  {l.aiQuality}
                </Badge>
              )}
              {l.aiMatchType && (
                <Badge variant="outline" className="text-[10px]">
                  {l.aiMatchType} match
                </Badge>
              )}
            </div>
            {l.rejectionReason && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400">{l.rejectionReason}</p>
              </div>
            )}
            {l.aiWarnings && l.aiWarnings.length > 0 && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  {l.aiWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {l.aiSummary && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <BrainCircuit className="h-4 w-4 text-purple-500" />
              AI Insights
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Quote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-400" />
                <p className="italic">{l.aiSummary}</p>
              </div>
              {l.aiWeaknesses && l.aiWeaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" /> Weaknesses
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                    {l.aiWeaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {l.aiOpportunities && l.aiOpportunities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-500 flex items-center gap-1 mt-2">
                    <CheckCircle2 className="h-3 w-3" /> Opportunities
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                    {l.aiOpportunities.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
</>
        )}

        {/* ── Responsive Audit Tab ── */}
        {activeTab === 'responsive' && (
          <div className="space-y-4 mt-4">
            {l.analysisEligible === false ? (
              <div className="border border-[#E4E1DB] rounded-xl p-6 bg-white">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F1F0EC] flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-[#74726E]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-[14px] font-semibold text-[#18181B]">No Standalone Business Website Detected</h4>
                    <p className="text-[12.5px] text-[#52525B] leading-relaxed">
                      This lead currently uses{' '}
                      <span className="font-medium text-[#18181B]">
                        {l.websiteType === 'GOOGLE_PROFILE' ? 'a Google Business Profile' :
                         l.websiteType === 'SOCIAL_PROFILE' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social media') :
                         l.websiteType === 'MARKETPLACE_PROFILE' ? 'a marketplace' :
                         l.websiteType === 'DIRECTORY_PROFILE' ? 'directory listings' :
                         l.websiteClassification === 'google_business_profile' ? 'a Google Business Profile' :
                         l.websiteClassification === 'directory_listing' ? 'directory listings' :
                          l.websiteClassification === 'social_profile' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social media') :
                           'an online profile'}
                      </span>{' '}
                      instead of an independent business website.
                    </p>
                    <p className="text-[12px] text-[#74726E] leading-relaxed">
                      Website audits (responsive, UI/UX, SEO) are available only for standalone business websites.
                    </p>
                    <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3 mt-2">
                      <p className="text-[12px] font-semibold text-[#92400E] flex items-center gap-1.5 mb-1.5">
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                        High Website Development Potential
                      </p>
                      <p className="text-[11.5px] text-[#92400E]">
                        This business is a strong candidate for a professional website build.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Responsive</p>
                    <p className={`text-xl font-bold ${
                      (l.responsiveScore || 0) >= 80 ? 'text-green-600' : (l.responsiveScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {l.responsiveScore || 0}
                    </p>
                    <Badge variant={
                      l.responsiveStatus === 'excellent' ? 'default' :
                      l.responsiveStatus === 'good' ? 'secondary' :
                      l.responsiveStatus === 'average' ? 'outline' :
                      'destructive'
                    } className="text-[8px] mt-1">
                      {l.responsiveStatus || 'N/A'}
                    </Badge>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider">UI/UX</p>
                    <p className={`text-xl font-bold ${
                      (l.uiuxScore || 0) >= 80 ? 'text-green-600' : (l.uiuxScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {l.uiuxScore || 0}
                    </p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-teal-500 uppercase tracking-wider">Mobile</p>
                    <p className={`text-xl font-bold ${
                      (l.mobileExperienceScore || 0) >= 80 ? 'text-green-600' : (l.mobileExperienceScore || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {l.mobileExperienceScore || 0}
                    </p>
                  </div>
                </div>

                {l.responsiveAudit && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Responsive Checks</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Mobile Friendly', value: l.responsiveAudit.mobileFriendly },
                        { label: 'Responsive Layout', value: l.responsiveAudit.responsiveLayout },
                        { label: 'Viewport Meta', value: l.responsiveAudit.viewportMeta },
                        { label: 'Touch Friendly', value: l.responsiveAudit.touchFriendly },
                        { label: 'No Horizontal Scroll', value: !l.responsiveAudit.horizontalScroll },
                        { label: 'No Overflow Issues', value: !l.responsiveAudit.overflowIssues },
                        { label: 'Font Size OK', value: !l.responsiveAudit.fontSizeIssues },
                      ].map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5 text-xs">
                          {check.value ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                          )}
                          <span className={check.value ? 'text-green-700' : 'text-red-700'}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {l.uiuxAudit && l.uiuxAudit.issues && l.uiuxAudit.issues.length > 0 && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      UI/UX Issues ({l.uiuxAudit.issues.length})
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {l.uiuxAudit.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <span className={`shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full ${
                            issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-muted-foreground">{issue.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {l.websiteAudit && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-indigo-500" />
                      Website Audit
                      <Badge variant={
                        (l.websiteAudit.score || 0) >= 80 ? 'default' :
                        (l.websiteAudit.score || 0) >= 50 ? 'secondary' : 'destructive'
                      } className="text-[8px] ml-auto">{l.websiteAudit.score || 0}</Badge>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'HTTPS', value: l.websiteAudit.https },
                        { label: 'CMS', value: l.websiteAudit.cms || 'Unknown', isText: true },
                        { label: 'Contact Page', value: l.websiteAudit.contactPage === 'found' },
                        { label: 'About Page', value: l.websiteAudit.aboutPage === 'found' },
                        { label: 'Services Page', value: l.websiteAudit.servicesPage === 'found' },
                        { label: 'Privacy Policy', value: l.websiteAudit.privacyPolicy },
                        { label: 'Terms & Conditions', value: l.websiteAudit.terms },
                        { label: 'Contact Form', value: l.websiteAudit.contactForm },
                        { label: 'Email Found', value: l.websiteAudit.emailPresent },
                        { label: 'Phone Found', value: l.websiteAudit.phonePresent },
                      ].map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5 text-xs">
                          {'isText' in check && check.isText ? (
                            <>
                              <Info className="h-3 w-3 text-blue-500 shrink-0" />
                              <span>{check.label}: <span className="font-medium">{check.value}</span></span>
                            </>
                          ) : check.value ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="text-green-700">{check.label}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                              <span className="text-red-700">{check.label}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {l.websiteAudit.detectedIssues?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Issues ({l.websiteAudit.detectedIssues.length})
                        </p>
                        {l.websiteAudit.detectedIssues.map((issue, i) => (
                          <p key={i} className="text-[10px] text-amber-700 flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                            {issue}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(l.desktopScreenshot || l.mobileScreenshot) && (
                  <div className="grid grid-cols-2 gap-3">
                    {l.desktopScreenshot && (
                      <div className="border border-border/40 rounded-lg overflow-hidden">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider p-2 bg-muted/30">Desktop</p>
                        <div className="relative h-40 bg-muted/10">
                          <img src={l.desktopScreenshot} alt="Desktop screenshot" className="w-full h-full object-cover object-top" loading="lazy" />
                        </div>
                      </div>
                    )}
                    {l.mobileScreenshot && (
                      <div className="border border-border/40 rounded-lg overflow-hidden">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider p-2 bg-muted/30">Mobile</p>
                        <div className="relative h-40 bg-muted/10 flex justify-center">
                          <img src={l.mobileScreenshot} alt="Mobile screenshot" className="h-full object-contain" loading="lazy" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!l.responsiveAuditCompleted && (
                  l.responsiveAuditReady ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                      <p className="text-xs text-blue-700">Responsive audit is in progress...</p>
                    </div>
                  ) : (
                    renderAIProcessing('responsiveAuditReady', 'Responsive Audit', false) || (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700">Responsive audit not yet completed for this lead.</p>
                      </div>
                    )
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* ── Website Intelligence Tab ── */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4 mt-4">
            {l.analysisEligible === false ? (
              <div className="border border-[#E4E1DB] rounded-xl p-6 bg-white">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#F1F0EC] flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[#74726E]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-[14px] font-semibold text-[#18181B]">Business Presence Analysis</h4>
                    <p className="text-[12.5px] text-[#52525B] leading-relaxed">
                      This business currently relies on{' '}
                      <span className="font-medium text-[#18181B]">
                        {l.websiteType === 'GOOGLE_PROFILE' ? 'a Google Business Profile' :
                         l.websiteType === 'SOCIAL_PROFILE' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social profiles') :
                         l.websiteType === 'MARKETPLACE_PROFILE' ? 'a marketplace' :
                         l.websiteType === 'DIRECTORY_PROFILE' ? 'directory listings' :
                         l.websiteClassification === 'google_business_profile' ? 'a Google Business Profile' :
                         l.websiteClassification === 'directory_listing' ? 'directory listings' :
                         l.websiteClassification === 'social_profile' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social profiles') :
                          'an online presence'}
                      </span>{' '}
                      instead of a standalone business website.
                    </p>
                    <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3 mt-2">
                      <p className="text-[12px] font-semibold text-[#92400E] flex items-center gap-1.5 mb-1.5">
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                        Very High Opportunity — No Website Competition
                      </p>
                      <p className="text-[11.5px] text-[#92400E] leading-relaxed">
                        Businesses without dedicated websites are ideal candidates for:
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {['Website development', 'SEO setup', 'Google ranking', 'Lead generation'].map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-[11.5px] text-[#92400E]">
                            <CheckCircle2 className="h-3 w-3 text-[#D97706] shrink-0" strokeWidth={2} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-[#18181B]">Website Intelligence</h4>
                    {l.intelligenceCompleted && (
                      <span className="text-[11px] text-[#8E8C86]">
                        Analyzed {l.intelligenceAnalysisDuration ? `${(l.intelligenceAnalysisDuration / 1000).toFixed(1)}s` : ''}
                        {l.intelligenceAnalyzedAt ? ` · ${new Date(l.intelligenceAnalyzedAt).toLocaleString()}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {l.intelligenceWebsiteHash && (
                      <span className="text-[10px] text-[#B0AEA8] font-mono">v{/*l.intelligenceWebsiteHash.substring(0, 6)*/}{l.intelligenceWebsiteHash?.substring(0, 6) || ''}</span>
                    )}
                    <button
                      onClick={async () => {
                        try {
                          await analyzeIntelligence({ leadId: l.id, forceRefresh: true });
                          queryClient.invalidateQueries({ queryKey: ['lead-details', l.id] });
                        } catch { }
                      }}
                      disabled={isIntelligenceAnalyzing}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] border border-[#E4E1DB] bg-white text-[11px] font-medium text-[#52525B] hover:bg-[#F5F3EF] disabled:opacity-50 transition-all"
                    >
                      {isIntelligenceAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Refresh
                    </button>
                  </div>
                </div>

                {isIntelligenceAnalyzing && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                    <p className="text-xs text-blue-700">Analyzing website in real-time...</p>
                  </div>
                )}

                {!l.websiteIntelligence && !isIntelligenceAnalyzing && (
                  l.intelligenceReady ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                      <p className="text-xs text-blue-700">Website intelligence is being generated...</p>
                    </div>
                  ) : (
                    renderAIProcessing('intelligenceReady', 'Intelligence', false) || (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700">Website intelligence not yet available. It will be generated automatically.</p>
                      </div>
                    )
                  )
                )}

                {l.websiteIntelligence && (
                  <>
                    {/* Score Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Trust', value: l.websiteIntelligence.trustScore, color: l.websiteIntelligence.trustScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.trustScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Quality', value: l.websiteIntelligence.qualityScore, color: l.websiteIntelligence.qualityScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.qualityScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'SEO', value: l.websiteIntelligence.seoScore, color: l.websiteIntelligence.seoScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.seoScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Performance', value: l.websiteIntelligence.performanceScore, color: l.websiteIntelligence.performanceScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.performanceScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Security', value: l.websiteIntelligence.securityScore, color: l.websiteIntelligence.securityScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.securityScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'UI', value: l.websiteIntelligence.uiScore, color: l.websiteIntelligence.uiScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.uiScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'UX', value: l.websiteIntelligence.uxScore, color: l.websiteIntelligence.uxScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.uxScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Accessibility', value: l.websiteIntelligence.accessibilityScore, color: l.websiteIntelligence.accessibilityScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.accessibilityScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Mobile', value: l.websiteIntelligence.mobileScore, color: l.websiteIntelligence.mobileScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.mobileScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Opportunity', value: l.websiteIntelligence.businessOpportunityScore, color: l.websiteIntelligence.businessOpportunityScore >= 70 ? 'text-green-600 bg-green-50' : l.websiteIntelligence.businessOpportunityScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                        { label: 'Priority', value: l.websiteIntelligence.leadPriorityScore, color: l.websiteIntelligence.leadPriorityScore >= 70 ? 'text-indigo-600 bg-indigo-50' : l.websiteIntelligence.leadPriorityScore >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-lg p-2.5 text-center ${color.split(' ').slice(1).join(' ')}`}>
                          <p className="text-[9px] font-medium uppercase tracking-wider opacity-70">{label}</p>
                          <p className={`text-base font-bold ${color.split(' ')[0]}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Issues */}
                    {l.websiteIntelligence.issues && l.websiteIntelligence.issues.length > 0 && (
                      <div className="border border-border/40 rounded-lg">
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            Detected Issues ({l.websiteIntelligence.issues.length})
                          </p>
                        </div>
                        <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto">
                          {l.websiteIntelligence.issues.map((issue, i) => (
                            <div key={i} className="px-3 py-2.5">
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                  issue.severity === 'critical' ? 'bg-red-500' :
                                  issue.severity === 'high' ? 'bg-orange-500' :
                                  issue.severity === 'medium' ? 'bg-amber-500' :
                                  'bg-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-[#18181B]">{issue.description}</span>
                                    <Badge variant="outline" className="text-[8px] px-1 py-0">{issue.category}</Badge>
                                    <Badge variant="outline" className={`text-[8px] px-1 py-0 ${
                                      issue.severity === 'critical' ? 'text-red-600 border-red-200' :
                                      issue.severity === 'high' ? 'text-orange-600 border-orange-200' :
                                      'text-gray-500'
                                    }`}>{issue.severity}</Badge>
                                  </div>
                                  <p className="text-[11px] text-[#52525B] mt-0.5">{issue.detail}</p>
                                  <p className="text-[10px] text-blue-600 mt-0.5">{issue.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {l.websiteIntelligence.recommendations && l.websiteIntelligence.recommendations.length > 0 && (
                      <div className="border border-border/40 rounded-lg">
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-purple-500" />
                            Recommendations ({l.websiteIntelligence.recommendations.length})
                          </p>
                        </div>
                        <div className="divide-y divide-border/30">
                          {l.websiteIntelligence.recommendations.map((rec, i) => (
                            <div key={i} className="px-3 py-2.5">
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white ${
                                  rec.impact === 'high' ? 'bg-red-500' : rec.impact === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                }`}>{i + 1}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-[#18181B]">{rec.title}</span>
                                    <Badge variant="outline" className="text-[8px] px-1 py-0">{rec.category}</Badge>
                                  </div>
                                  <p className="text-[11px] text-[#52525B] mt-0.5">{rec.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance & Meta Details */}
                    {l.websiteIntelligence.performanceMetrics && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-border/40 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Performance
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">Load Time</span><span className="font-medium">{(l.websiteIntelligence.performanceMetrics as any).loadTime ? `${((l.websiteIntelligence.performanceMetrics as any).loadTime / 1000).toFixed(1)}s` : 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">DOM Size</span><span className="font-medium">{(l.websiteIntelligence.performanceMetrics as any).domSize || 'N/A'} nodes</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Resources</span><span className="font-medium">{(l.websiteIntelligence.performanceMetrics as any).totalResources || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Images</span><span className="font-medium">{(l.websiteIntelligence.performanceMetrics as any).imageCount || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Lazy Loading</span><span className="font-medium">{(l.websiteIntelligence.performanceMetrics as any).hasLazyLoading ? 'Yes' : 'No'}</span></div>
                          </div>
                        </div>

                        <div className="border border-border/40 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Meta & SEO
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="truncate"><span className="text-muted-foreground">Title:</span> <span className="font-medium">{(l.websiteIntelligence.metaAnalysis as any)?.title || 'N/A'}</span></div>
                            <div className="truncate"><span className="text-muted-foreground">Description:</span> <span className="font-medium">{(l.websiteIntelligence.metaAnalysis as any)?.metaDescription || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Canonical</span><span className="font-medium">{(l.websiteIntelligence.metaAnalysis as any)?.canonical ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Schema.org</span><span className="font-medium">{(l.websiteIntelligence.metaAnalysis as any)?.hasSchemaOrg ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">JSON-LD</span><span className="font-medium">{(l.websiteIntelligence.metaAnalysis as any)?.hasJSONLD ? 'Yes' : 'No'}</span></div>
                          </div>
                        </div>

                        <div className="border border-border/40 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Security
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">SSL/HTTPS</span><span className="font-medium">{(l.websiteIntelligence.securityDetails as any)?.sslValid ? '✅ Valid' : '❌ Not Found'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">HSTS</span><span className="font-medium">{(l.websiteIntelligence.securityDetails as any)?.hsts ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">X-Frame-Options</span><span className="font-medium">{(l.websiteIntelligence.securityDetails as any)?.xFrameOptions ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Cookie Consent</span><span className="font-medium">{(l.websiteIntelligence.securityDetails as any)?.hasCookieBanner ? 'Yes' : 'No'}</span></div>
                          </div>
                        </div>

                        <div className="border border-border/40 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            UI & Content
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-muted-foreground">Navigation</span><span className="font-medium">{(l.websiteIntelligence.uiDetails as any)?.hasNavigation ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Footer</span><span className="font-medium">{(l.websiteIntelligence.uiDetails as any)?.hasFooter ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">CTAs</span><span className="font-medium">{(l.websiteIntelligence.uiDetails as any)?.hasCTAs ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Contact Page</span><span className="font-medium">{(l.websiteIntelligence.contentAnalysis as any)?.hasContactPage ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Blog</span><span className="font-medium">{(l.websiteIntelligence.uiDetails as any)?.hasBlog ? 'Yes' : 'No'}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Sales Intelligence Tab ── */}
        {activeTab === 'sales' && (
          <div className="space-y-4 mt-4">
            {l.analysisEligible === false ? (
              <div className="border border-[#E4E1DB] rounded-xl p-6 bg-white">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#FFF1F0] flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-[14px] font-semibold text-[#18181B]">AI Sales Recommendation</h4>
                    <p className="text-[12.5px] text-[#52525B] leading-relaxed">
                      This business does not currently own a standalone website. High probability lead for website development and digital growth services.
                    </p>
                    <div className="bg-[#FFF1F0] border border-[#FECACA] rounded-lg p-3 mt-2">
                      <p className="text-[12px] font-semibold text-[#991B1B] flex items-center gap-1.5 mb-2">
                        <Lightbulb className="h-3.5 w-3.5" strokeWidth={2} />
                        Recommended Services
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: ' Website Development', icon: Layout },
                          { label: ' Local SEO', icon: Search },
                          { label: ' Google My Business', icon: Map },
                          { label: ' Digital Marketing', icon: Target },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-[#7F1D1D]">
                              <Icon className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#71717A] italic flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-[#A1A1AA]" strokeWidth={1.5} />
                      High conversion potential — no existing web presence to compete with
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  AI Sales Intelligence Report
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider">AI Score</p>
                    <p className={`text-xl font-bold ${
                      (l.aiLeadScore || 0) >= 70 ? 'text-green-600' : (l.aiLeadScore || 0) >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {l.aiLeadScore || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Sales Priority</p>
                    <p className={`text-xl font-bold ${
                      l.salesPriority === 'urgent' ? 'text-red-600' :
                      l.salesPriority === 'high' ? 'text-orange-600' :
                      l.salesPriority === 'normal' ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {l.salesPriority ? l.salesPriority.toUpperCase() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider">Conversion</p>
                    <p className={`text-xl font-bold ${
                      l.conversionProbability === 'high' ? 'text-green-600' :
                      l.conversionProbability === 'medium' ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {l.conversionProbability ? l.conversionProbability.toUpperCase() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Layout className="h-3 w-3 text-indigo-500" />
                      Redesign
                    </p>
                    <Badge variant={
                      l.websiteRedesignPotential === 'high' ? 'destructive' :
                      l.websiteRedesignPotential === 'medium' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.websiteRedesignPotential || 'N/A'}
                    </Badge>
                  </div>
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Search className="h-3 w-3 text-green-500" />
                      SEO
                    </p>
                    <Badge variant={
                      l.seoOpportunity === 'high' ? 'destructive' :
                      l.seoOpportunity === 'medium' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.seoOpportunity || 'N/A'}
                    </Badge>
                  </div>
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Target className="h-3 w-3 text-cyan-500" />
                      Digital Mktg
                    </p>
                    <Badge variant={
                      l.digitalMarketingOpportunity === 'high' ? 'destructive' :
                      l.digitalMarketingOpportunity === 'medium' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.digitalMarketingOpportunity || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      Revenue Potential
                    </p>
                    <Badge variant={
                      l.revenuePotential === 'enterprise' ? 'default' :
                      l.revenuePotential === 'high' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.revenuePotential || 'N/A'}
                    </Badge>
                  </div>
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      <BarChart3 className="h-3 w-3 text-red-500" />
                      Competition
                    </p>
                    <Badge variant={
                      l.competitionLevel === 'high' ? 'destructive' :
                      l.competitionLevel === 'medium' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.competitionLevel || 'N/A'}
                    </Badge>
                  </div>
                </div>

                {l.marketOpportunity && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Market Opportunity
                    </p>
                    <Badge variant={
                      l.marketOpportunity === 'high' ? 'default' :
                      l.marketOpportunity === 'medium' ? 'secondary' : 'outline'
                    } className="text-[10px]">
                      {l.marketOpportunity.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {l.aiInsight && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-amber-500" />
                      AI Insight
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">{l.aiInsight.summary}</p>
                    {l.aiInsight.recommendedAction && (
                      <div className="flex items-start gap-1.5 text-xs p-2 bg-blue-50 rounded-md mb-2">
                        <ThumbsUp className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-blue-700">{l.aiInsight.recommendedAction}</span>
                      </div>
                    )}
                    {l.aiInsight.expectedOutcome && (
                      <div className="flex items-start gap-1.5 text-xs p-2 bg-green-50 rounded-md mb-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-green-700">{l.aiInsight.expectedOutcome}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {l.aiInsight.strengths?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-green-500 flex items-center gap-1 mb-1">
                            <ThumbsUp className="h-3 w-3" /> Strengths
                          </p>
                          <ul className="list-disc list-inside text-[10px] text-muted-foreground space-y-0.5">
                            {l.aiInsight.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {l.aiInsight.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-red-500 flex items-center gap-1 mb-1">
                            <AlertCircle className="h-3 w-3" /> Weaknesses
                          </p>
                          <ul className="list-disc list-inside text-[10px] text-muted-foreground space-y-0.5">
                            {l.aiInsight.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!l.salesIntelligenceCompleted && !l.salesAIReady && (
                  renderAIProcessing('salesAIReady', 'Sales AI', false) || (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700">AI Sales Intelligence not yet completed for this lead.</p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* ── Outreach Tab ── */}
        {activeTab === 'outreach' && (
          <div className="space-y-4 mt-4">
            {l.analysisEligible === false ? (
              <div className="border border-[#E4E1DB] rounded-xl p-6 bg-white">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#EBF5FF] flex items-center justify-center flex-shrink-0">
                    <SendHorizonal className="h-5 w-5 text-[#2563EB]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-[14px] font-semibold text-[#18181B]">Personalized Outreach</h4>
                    <p className="text-[12.5px] text-[#52525B] leading-relaxed">
                      We noticed your business currently relies on{' '}
                      <span className="font-medium text-[#18181B]">
                        {l.websiteType === 'GOOGLE_PROFILE' ? 'Google Maps / Google Business Profile' :
                         l.websiteType === 'SOCIAL_PROFILE' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social media') :
                         l.websiteType === 'MARKETPLACE_PROFILE' ? 'a marketplace' :
                         l.websiteType === 'DIRECTORY_PROFILE' ? 'online directories' :
                         l.websiteClassification === 'google_business_profile' ? 'Google Maps / Google Business Profile' :
                         l.websiteClassification === 'social_profile' ? (l.socialPlatform ? `${l.socialPlatform.charAt(0).toUpperCase() + l.socialPlatform.slice(1)}` : 'social media') :
                         l.websiteClassification === 'directory_listing' ? 'online directories' :
                         'online presence'}
                      </span>{' '}
                      instead of a dedicated website.
                    </p>
                    <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 mt-2">
                      <p className="text-[12px] font-semibold text-[#166534] flex items-center gap-1.5 mb-2">
                        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                        Outreach Strategy
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { platform: 'Professional Website', method: 'Build your online presence', tip: 'Helps improve Google visibility and customer trust' },
                          { platform: 'Lead Generation', method: 'Capture more local customers', tip: 'Turn visitors into paying customers 24/7' },
                          { platform: 'Digital Growth', method: 'Expand beyond social platforms', tip: 'Own your audience, don\'t rent it from algorithms' },
                        ].map((item) => (
                          <div key={item.platform} className="flex items-start gap-2 text-[11.5px] text-[#166534]">
                            <CheckCircle2 className="h-3 w-3 text-[#16A34A] shrink-0 mt-0.5" strokeWidth={2} />
                            <div>
                              <span className="font-medium">{item.platform}</span>
                              <span className="text-[#15803D]"> — {item.method}</span>
                              <p className="text-[10.5px] text-[#22C55E] mt-0.5">{item.tip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#71717A] italic flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-[#A1A1AA]" strokeWidth={1.5} />
                      Which time are you free for a quick discussion?
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <SendHorizonal className="h-4 w-4 text-blue-500" />
                      AI Outreach & Proposals
                    </h4>
                  </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-blue-500 uppercase tracking-wider">Probability</p>
                    <p className={`text-xl font-bold ${
                      outreachData?.outreachProbability === 'high' ? 'text-green-600' :
                      outreachData?.outreachProbability === 'medium' ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {outreachData?.outreachProbability ? outreachData.outreachProbability.toUpperCase() : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Score</p>
                    <p className="text-xl font-bold text-indigo-600">{outreachData?.outreachProbabilityScore || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-medium text-purple-500 uppercase tracking-wider">Status</p>
                    <Badge variant={
                      outreachData?.crmOutreachStatus === 'interested' || outreachData?.crmOutreachStatus === 'responded' ? 'default' :
                      outreachData?.crmOutreachStatus === 'proposal_sent' || outreachData?.crmOutreachStatus === 'email_sent' ? 'secondary' : 'outline'
                    } className="text-[9px] mt-1">
                      {outreachData?.crmOutreachStatus ? outreachData.crmOutreachStatus.replace(/_/g, ' ') : 'pending'}
                    </Badge>
                  </div>
                </div>

                {outreachData?.outreachCompleted && (
                  <div className="flex flex-wrap gap-1.5">
                    {['outreach_pending', 'email_sent', 'whatsapp_sent', 'followup_pending', 'proposal_sent', 'responded', 'interested', 'closed'].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={outreachData.crmOutreachStatus === status ? 'default' : 'outline'}
                        className="text-[9px] h-6 px-2"
                        onClick={() => l.id && updateStatus.mutate({ leadId: l.id, status })}
                        disabled={updateStatus.isPending || !l.id}
                      >
                        {status.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                )}

                {(() => {
                  const emails = outreachData?.generatedEmails || l.generatedEmails || [];
                  return emails.length > 0 ? (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MailOpen className="h-3 w-3 text-blue-500" />
                      Generated Cold Emails
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {emails.map((email: any, i: number) => (
                        <details key={i} className="group">
                          <summary className="text-xs font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1.5 p-1.5 rounded hover:bg-muted/30">
                            <File className="h-3 w-3 text-muted-foreground" />
                            {email.subject || email.type}
                            <Badge variant="secondary" className="text-[8px] ml-auto">{email.type}</Badge>
                          </summary>
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans mt-1 p-2 bg-muted/20 rounded-md">{email.body}</pre>
                        </details>
                      ))}
                    </div>
                  </div>
                 ) : null; })()}

                {(() => {
                  const msgs = outreachData?.generatedWhatsAppMessages || l.generatedWhatsAppMessages || [];
                  return msgs.length > 0 ? (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-green-500" />
                      WhatsApp Messages
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(msgs).map((msg: any, i: number) => (
                        <details key={i} className="group">
                          <summary className="text-xs font-medium cursor-pointer hover:text-green-600 flex items-center gap-1.5 p-1.5 rounded hover:bg-muted/30">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            {msg.type.replace(/-/g, ' ')}
                            <Badge variant="secondary" className="text-[8px] ml-auto">{msg.type}</Badge>
                          </summary>
                          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans mt-1 p-2 bg-muted/20 rounded-md">{msg.content}</pre>
                        </details>
                      ))}
                    </div>
                  </div>
                 ) : null; })()}

                {(() => {
                  const proposals = outreachData?.generatedProposals || l.generatedProposals || [];
                  return proposals.length > 0 ? (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ClipboardList className="h-3 w-3 text-indigo-500" />
                      Proposals
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {proposals.map((proposal: any, i: number) => (
                        <details key={i} className="group">
                          <summary className="text-xs font-medium cursor-pointer hover:text-indigo-600 flex items-center gap-1.5 p-1.5 rounded hover:bg-muted/30">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            {proposal.title || proposal.type}
                            <Badge variant="secondary" className="text-[8px] ml-auto">{proposal.type}</Badge>
                          </summary>
                          <div className="mt-1 space-y-1">
                            <p className="text-[11px] text-muted-foreground">{proposal.summary}</p>
                            {proposal.services?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {proposal.services.map((s: string, j: number) => (
                                  <Badge key={j} variant="secondary" className="text-[8px]">{s}</Badge>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {proposal.estimatedTimeline && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">Timeline:</span> {proposal.estimatedTimeline}
                                </div>
                              )}
                              {proposal.estimatedInvestment && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">Investment:</span> {proposal.estimatedInvestment}
                                </div>
                              )}
                            </div>
                            {proposal.html && (
                              <div className="mt-2 border rounded-md overflow-hidden">
                                <div className="bg-muted/30 px-2 py-1 text-[9px] text-muted-foreground flex items-center justify-between">
                                  <span>Proposal Preview</span>
                                  <span className="text-[8px]">HTML</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto p-2">
                                  <div dangerouslySetInnerHTML={{ __html: proposal.html.slice(0, 2000) }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                 ) : null; })()}

                {(() => {
                  const seq = outreachData?.followupSequence || l.followupSequence || [];
                  return seq.length > 0 ? (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-orange-500" />
                      Follow-up Sequence
                    </p>
                    <div className="space-y-2">
                      {seq.map((f: any, i: number) => (
                        <div key={i} className="border-l-2 border-muted pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px]">#{f.stage}</Badge>
                            <Badge variant="secondary" className="text-[8px]">{f.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">Delay: {f.delayDays}d</span>
                          </div>
                          {f.subject && <p className="text-[11px] font-medium mt-1">{f.subject}</p>}
                          <details>
                            <summary className="text-[10px] cursor-pointer text-muted-foreground hover:text-foreground mt-0.5">View content</summary>
                            <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-sans mt-1 p-2 bg-muted/20 rounded-md">{f.content}</pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                  ) : null; })()}

                {l.generatedEmail && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MailOpen className="h-3 w-3 text-blue-500" />
                      Generated Cold Email
                      {l.outreachSubject && <Badge variant="secondary" className="text-[8px] ml-auto">{l.outreachSubject}</Badge>}
                    </p>
                    <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans p-2 bg-muted/20 rounded-md max-h-48 overflow-y-auto">{l.generatedEmail}</pre>
                  </div>
                )}

                {l.generatedWhatsApp && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-green-500" />
                      WhatsApp Message
                    </p>
                    <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans p-2 bg-muted/20 rounded-md max-h-48 overflow-y-auto">{l.generatedWhatsApp}</pre>
                  </div>
                )}

                {l.generatedCallScript && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-purple-500" />
                      Call Script
                    </p>
                    <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans p-2 bg-muted/20 rounded-md max-h-48 overflow-y-auto">{l.generatedCallScript}</pre>
                  </div>
                )}

                {l.generatedWebsiteProposal && (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-indigo-500" />
                      Website Proposal
                    </p>
                    <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-sans p-2 bg-muted/20 rounded-md max-h-64 overflow-y-auto">{l.generatedWebsiteProposal}</pre>
                  </div>
                )}

                {(() => {
                  const hist = outreachData?.outreachHistory || l.outreachHistory || [];
                  return hist.length > 0 ? (
                  <div className="border border-border/40 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      Outreach History
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {hist.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground py-1 border-b border-border/20 last:border-0">
                          <Badge variant={
                            entry.status === 'sent' ? 'secondary' :
                            entry.status === 'opened' ? 'default' :
                            entry.status === 'responded' ? 'default' : 'outline'
                          } className="text-[7px]">{entry.type}</Badge>
                          <span className={`capitalize ${entry.status === 'responded' ? 'text-green-600 font-medium' : ''}`}>{entry.status}</span>
                          {entry.subject && <span className="truncate max-w-[200px]">{entry.subject}</span>}
                          <span className="ml-auto text-[9px]">{entry.generatedAt ? new Date(entry.generatedAt).toLocaleDateString() : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                 ) : null; })()}

                {!l.outreachCompleted && !l.outreachReady && !outreachData?.outreachCompleted && (
                  renderAIProcessing('outreachReady', 'Outreach', false) || (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700">Outreach materials are being generated automatically in the background.</p>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Website Audit Report
              </h3>
              <div className="flex items-center gap-2">
                {reportGenerated || l.reportReady || l.reportGenerated ? (
                  <>
                    <Button size="sm" variant="default" className="h-8 text-xs" onClick={viewReport}>
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      View Report
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={downloadReport}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download PDF
                    </Button>
                  </>
                ) : reportGenerating ? (
                  <Button size="sm" variant="outline" className="h-8 text-xs text-amber-600 border-amber-300" disabled>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Generating...
                  </Button>
                ) : (
                  renderAIProcessing('reportReady', 'Report', false) || (
                    <Button size="sm" variant="outline" className="h-8 text-xs" disabled>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Auto-generating...
                    </Button>
                  )
                )}
              </div>
            </div>

            {reportGenerating && reportProgress && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  <span className="text-sm font-medium text-amber-800">{reportProgress.message}</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(reportProgress.percent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-amber-600 mt-1">{Math.min(reportProgress.percent, 100)}% complete</p>
              </div>
            )}

            {(reportGenerated || l.analysisReport) && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-800">Report Generated Successfully</span>
                  </div>
                  <p className="text-xs text-green-600">
                    A complete professional website audit report is available for this lead.
                    Click "View Report" to see it in your browser or "Download PDF" to save it.
                  </p>
                </div>
                {l.analysisReport && (
                  <div className="border border-border/40 rounded-lg divide-y divide-border/40">
                    {(l.analysisReport as any).businessSummary && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Summary</p>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <span>Name: <strong>{(l.analysisReport as any).businessSummary.companyName}</strong></span>
                          <span>Category: <strong>{(l.analysisReport as any).businessSummary.category}</strong></span>
                          <span>Location: <strong>{(l.analysisReport as any).businessSummary.location}</strong></span>
                          <span>Rating: <strong>{(l.analysisReport as any).businessSummary.rating} ({ (l.analysisReport as any).businessSummary.reviewsCount} reviews)</strong></span>
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).websiteStatus && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Website Status</p>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {((l.analysisReport as any).websiteStatus.exists ? <Badge className="text-[8px]" variant="default">Website Exists</Badge> : <Badge className="text-[8px]" variant="destructive">No Website</Badge>)}
                          {((l.analysisReport as any).websiteStatus.reachable ? <Badge className="text-[8px]" variant="default">Reachable</Badge> : <Badge className="text-[8px]" variant="secondary">Unreachable</Badge>)}
                          {((l.analysisReport as any).websiteStatus.https ? <Badge className="text-[8px]" variant="default">HTTPS</Badge> : <Badge className="text-[8px]" variant="secondary">No HTTPS</Badge>)}
                          {(l.analysisReport as any).websiteStatus.cms && <Badge className="text-[8px]" variant="secondary">{(l.analysisReport as any).websiteStatus.cms}</Badge>}
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).seoSummary && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">SEO Summary</p>
                        <p className="text-xs">Score: <strong>{((l.analysisReport as any).seoSummary.score || 0)}</strong></p>
                        {((l.analysisReport as any).seoSummary.issues?.length > 0) && (
                          <div className="mt-1 space-y-0.5">
                            {((l.analysisReport as any).seoSummary.issues || []).map((issue: string, i: number) => (
                              <p key={i} className="text-[10px] text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                {issue}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(l.analysisReport as any).performanceSummary && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Performance Summary</p>
                        <p className="text-xs">Score: <strong>{((l.analysisReport as any).performanceSummary.score || 0)}</strong> | Load: {((l.analysisReport as any).performanceSummary.loadTimeMs || 0)}ms</p>
                      </div>
                    )}
                    {(l.analysisReport as any).missingFeatures?.length > 0 && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Missing Features
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {((l.analysisReport as any).missingFeatures || []).map((f: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[8px] text-amber-700">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).improvementRecommendations?.length > 0 && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          Recommendations
                        </p>
                        <div className="space-y-1">
                          {((l.analysisReport as any).improvementRecommendations || []).map((r: string, i: number) => (
                            <p key={i} className="text-[10px] text-blue-700 flex items-start gap-1">
                              <span className="h-1 w-1 rounded-full bg-blue-500 shrink-0 mt-1" />
                              {r}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).leadScore !== undefined && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lead Score</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{(l.analysisReport as any).leadScore}</span>
                          <Badge variant={
                            (l.analysisReport as any).priority === 'high' ? 'default' :
                            (l.analysisReport as any).priority === 'medium' ? 'secondary' : 'outline'
                          }>{(l.analysisReport as any).priority}</Badge>
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).recommendedServices?.length > 0 && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Services</p>
                        <div className="flex flex-wrap gap-1">
                          {((l.analysisReport as any).recommendedServices || []).map((s: string, i: number) => (
                            <Badge key={i} variant="default" className="text-[8px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(l.analysisReport as any).websiteOpportunity && (
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Website Opportunity</p>
                        <Badge variant={
                          (l.analysisReport as any).websiteOpportunity.level === 'high' ? 'default' :
                          (l.analysisReport as any).websiteOpportunity.level === 'medium' ? 'secondary' : 'outline'
                        } className="text-[8px]">{(l.analysisReport as any).websiteOpportunity.level}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{(l.analysisReport as any).websiteOpportunity.explanation}</p>
                      </div>
                    )}
                    <div className="p-3 text-[9px] text-muted-foreground text-right">
                      Generated: {new Date((l.analysisReport as any).generatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </>
            )}

            {!reportGenerated && !reportGenerating && !l.reportReady && (
              renderAIProcessing('reportReady', 'Report', false) || (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Report being generated automatically</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        The comprehensive audit report will be available once AI analysis completes.
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
