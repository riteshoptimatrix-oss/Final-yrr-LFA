import { memo, useCallback, useMemo } from "react";
import { Lead } from "@/types/index";
import { Badge } from "@components/ui/badge";
import {
  Globe, Phone, MapPin, Star, ExternalLink, Building2,
  Smartphone, Shield, TrendingUp, BrainCircuit, Zap,
  SendHorizonal, Activity, Map, ChevronRight,
} from "lucide-react";
import { LeadSocialIcons, extractPlatformsFromLead } from "./lead-social-icons";
import { websiteClassification } from "@/services/website-classification.service";

export interface LeadListProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-100 text-green-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
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

const sourceColors: Record<string, { bg: string; dot: string }> = {
  'google-maps': { bg: '#FEF2F2', dot: '#EA4335' },
  justdial: { bg: '#FFFBEB', dot: '#D97706' },
  indiamart: { bg: '#F0FBF4', dot: '#15803D' },
  clutch: { bg: '#EEF2FF', dot: '#1D4ED8' },
};

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

function LeadListItemInner({ lead, onClick }: { lead: Lead; onClick: (lead: Lead) => void }) {
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

  const srcColor = sourceColors[lead.source] || { bg: '#FAFAF8', dot: '#52525B' };

  return (
    <div
      className="group flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150 border-b border-[#E8E5DF] last:border-b-0 hover:bg-[#FAF9F7]"
      onClick={handleClick}
    >
      <div className="h-2 w-2 rounded-full shrink-0 hidden sm:block" style={{ background: srcColor.dot }} />

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-12 sm:col-span-4 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[13.5px] text-[#18181B] truncate leading-tight group-hover:text-[#1D4ED8] transition-colors">
              {lead.companyName}
            </h3>
            <Badge variant="outline" className={`shrink-0 font-mono text-[10px] h-5 px-1.5 ${getScoreColor(lead.leadScore)}`}>
              {lead.leadScore}
            </Badge>
            <WebsitePresenceBadge hasWebsite={websiteInfo.hasWebsite} />
          </div>
          {lead.category && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 text-[#B0AEA8] shrink-0" />
              <span className="text-[11.5px] text-[#8E8C86] truncate">{lead.category}</span>
            </div>
          )}
        </div>

        <div className="col-span-12 sm:col-span-3 min-w-0">
          {businessEntry ? (
            <a
              href={businessEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:underline truncate"
            >
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{businessEntry.url.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-50" />
            </a>
          ) : nonBusinessEntries.length > 0 ? (
            <LeadSocialIcons items={nonBusinessEntries} size="sm" />
          ) : (
            <span className="flex items-center gap-1.5 text-[12px] text-[#B0AEA8]">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="italic">No Website</span>
            </span>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8E8C86] mt-0.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
        </div>

        <div className="col-span-12 sm:col-span-3 min-w-0 hidden md:block">
          {lead.address && (
            <div className="flex items-start gap-1.5 text-[11.5px] text-[#8E8C86]">
              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{lead.address}</span>
            </div>
          )}
          {lead.rating && (
            <div className="flex items-center gap-1 text-[11.5px] text-[#8E8C86] mt-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{lead.rating}/5</span>
            </div>
          )}
        </div>

        <div className="col-span-12 sm:col-span-2 flex items-center gap-1.5 justify-end">
          <div className="flex flex-wrap gap-1 justify-end">
            {lead.responsiveScore !== undefined && lead.responsiveScore > 0 && (
              <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium ${getScoreColor(lead.responsiveScore)}`}>
                <Smartphone className="h-2.5 w-2.5" />
                {lead.responsiveScore}
              </span>
            )}
            {lead.trustScore !== undefined && lead.trustScore > 0 && (
              <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium ${getScoreColor(lead.trustScore)}`}>
                <Shield className="h-2.5 w-2.5" />
                {lead.trustScore}
              </span>
            )}
            {lead.aiStatus === 'completed' && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium bg-green-100 text-green-800">
                <Activity className="h-2.5 w-2.5" />
                AI
              </span>
            )}
            {lead.businessOpportunity?.level === 'high' && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium bg-green-100 text-green-800">
                <TrendingUp className="h-2.5 w-2.5" />
                Opp
              </span>
            )}
            {lead.salesPriority === 'urgent' && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium bg-red-100 text-red-800">
                <Zap className="h-2.5 w-2.5" />
                Urgent
              </span>
            )}
            {lead.salesPriority === 'high' && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium bg-orange-100 text-orange-800">
                <BrainCircuit className="h-2.5 w-2.5" />
                Priority
              </span>
            )}
            {lead.outreachCompleted && lead.outreachProbability === 'high' && (
              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium bg-emerald-100 text-emerald-800">
                <SendHorizonal className="h-2.5 w-2.5" />
                Outreach
              </span>
            )}
            <Badge variant={getSourceBadgeVariant(lead.source)} className="text-[9px] px-1.5 py-0 h-4">
              {lead.source}
            </Badge>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-[#B0AEA8] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

const LeadListItem = memo(LeadListItemInner);

function LeadListInner({ leads, onLeadClick }: LeadListProps) {
  return (
    <div className="w-full border border-[#E8E5DF] rounded-[12px] overflow-hidden bg-white">
      <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#FAFAF8] border-b border-[#E8E5DF] text-[10px] font-semibold uppercase tracking-wider text-[#B0AEA8]">
        <div className="col-span-4 pl-1">Business</div>
        <div className="col-span-3">Website / Contact</div>
        <div className="col-span-3 hidden md:block">Location</div>
        <div className="col-span-2 text-right pr-2">Scores & Status</div>
      </div>
      {leads.map((lead, index) => (
        <LeadListItem key={lead.id ?? `lead-${index}`} lead={lead} onClick={onLeadClick} />
      ))}
    </div>
  );
}

export const LeadList = memo(LeadListInner);
