import { memo, useCallback, useMemo } from "react";
import { Lead } from "@/types/index";
import { useMegaAnalysis } from "@/hooks/useMegaAI";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { Globe, Phone, MapPin, Star, ExternalLink, Building2, Smartphone, Shield, TrendingUp, BrainCircuit, Zap, SendHorizonal, Activity, Map } from "lucide-react";
import { LeadSocialIcons, extractPlatformsFromLead } from "./lead-social-icons";
import { websiteClassification } from "@/services/website-classification.service";

export interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function getConfidenceColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
}

function getQualityBadgeVariant(quality?: string): "default" | "secondary" | "outline" | "destructive" {
  switch (quality) {
    case "excellent": return "default";
    case "good": return "secondary";
    case "average": return "outline";
    case "poor": return "destructive";
    default: return "outline";
  }
}

function getSourceBadgeVariant(source: string): "default" | "secondary" | "outline" {
  switch (source) {
    case "google-maps": return "default";
    case "justdial": return "secondary";
    case "indiamart": return "secondary";
    case "clutch": return "secondary";
    default: return "outline";
  }
}

function WebsitePresenceBadge({ hasWebsite }: { hasWebsite?: boolean }) {
  if (hasWebsite) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Website
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      No Website
    </span>
  );
}

function LeadCardInner({ lead, onClick }: LeadCardProps) {
  const handleClick = useCallback(() => onClick(lead), [lead, onClick]);

  const handleWebsiteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const websiteInfo = useMemo(() => websiteClassification.classify(lead.website), [lead.website]);

  const platformEntries = useMemo(() => extractPlatformsFromLead(lead), [lead]);

  const businessEntry = useMemo(
    () => platformEntries.find(p => p.classification === 'business_website' && p.platform === 'business'),
    [platformEntries]
  );

  const nonBusinessEntries = useMemo(
    () => platformEntries.filter(p => p.classification !== 'business_website' || p.platform !== 'business'),
    [platformEntries]
  );

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-border/50 hover:border-primary/20 overflow-hidden"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1 min-w-0">
              {lead.companyName}
            </h3>
            <Badge variant="outline" className={`shrink-0 font-mono text-xs ${getScoreColor(lead.leadScore)}`}>
              {lead.leadScore}
            </Badge>
            <WebsitePresenceBadge hasWebsite={websiteInfo.hasWebsite} />
          </div>

          {businessEntry ? (
            <a
              href={businessEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{businessEntry.url.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
            </a>
          ) : nonBusinessEntries.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <LeadSocialIcons items={nonBusinessEntries} size="sm" />
            </div>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground/60">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="italic">No Website</span>
            </span>
          )}

          {lead.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.address && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{lead.address}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {lead.category && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                <Building2 className="h-3 w-3" />
                {lead.category}
              </span>
            )}
            {lead.rating && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {lead.rating}/5
              </span>
            )}
            {lead.finalConfidence !== undefined && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getConfidenceColor(lead.finalConfidence)}`}>AI: {lead.finalConfidence}</span>
            )}
            {lead.responsiveScore !== undefined && lead.responsiveScore > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getScoreColor(lead.responsiveScore)}`}>
                <Smartphone className="h-3 w-3" />
                R:{lead.responsiveScore}
              </span>
            )}
            {lead.trustScore !== undefined && lead.trustScore > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getScoreColor(lead.trustScore)}`}>
                <Shield className="h-3 w-3" />
                T:{lead.trustScore}
              </span>
            )}
            {lead.businessOpportunity?.level === 'high' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3" />
                Opportunity
              </span>
            )}
            {lead.salesPriority === 'urgent' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-800">
                <Zap className="h-3 w-3" />
                Urgent
              </span>
            )}
            {lead.salesPriority === 'high' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-800">
                <BrainCircuit className="h-3 w-3" />
                Priority
              </span>
            )}
            {lead.outreachCompleted && lead.outreachProbability === 'high' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800">
                <SendHorizonal className="h-3 w-3" />
                Outreach Ready
              </span>
            )}
            {lead.aiStatus === 'completed' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800">
                <Activity className="h-3 w-3" />
                AI Ready
              </span>
            )}
            {lead.aiStatus === 'processing' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">
                <Activity className="h-3 w-3 animate-pulse" />
                AI Processing
              </span>
            )}
            {lead.aiStatus === 'queued' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700">
                AI Queued
              </span>
            )}
            {lead.aiStatus === 'failed' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-800">
                AI Failed
              </span>
            )}
            {lead.auditStatus?.overall === 'pending' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">
                Audits Pending
              </span>
            )}
            {lead.auditStatus?.overall === 'running' && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">
                <Activity className="h-3 w-3 animate-pulse" />
                Auditing
              </span>
            )}
            <Badge variant={getSourceBadgeVariant(lead.source)} className="ml-auto text-[10px] px-1.5 py-0">
              {lead.source}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const LeadCard = memo(LeadCardInner);
