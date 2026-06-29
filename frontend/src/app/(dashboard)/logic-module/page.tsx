"use client";

import { useState, useMemo } from "react";
import {
  BrainCircuit,
  Search,
  Smartphone,
  BarChart3,
  Globe,
  Zap,
  Workflow,
  Sparkles,
  Send,
  Server,
  Target,
  TrendingUp,
  DollarSign,
  Flag,
  Cpu,
  Palette,
  Mail,
  CheckCircle2,
  XCircle,
  BookOpen,
  ScrollText,
  Pointer,
  Gauge,
  Shield,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  Eye,
} from "lucide-react";
import { EngineSection } from "@components/logic-module/EngineSection";
import { LogicCard } from "@components/logic-module/LogicCard";
import { ScoreMeter } from "@components/logic-module/ScoreMeter";
import { LogicFlow } from "@components/logic-module/LogicFlow";
import { AnimatedPipeline } from "@components/logic-module/AnimatedPipeline";
import { ArchitectureGraph } from "@components/logic-module/ArchitectureGraph";
import {
  LEAD_SCORE_WEIGHTS,
  LEAD_QUALIFICATION,
  SEO_SCORE_COMPONENTS,
  SEO_GRADE_SCALE,
  RESPONSIVE_DEDUCTIONS,
  RESPONSIVE_SCORE_LEVELS,
  TRUST_SCORE_FACTORS,
  TRUST_LEVELS,
  OPPORTUNITY_DETECTION_FACTORS,
  OPPORTUNITY_LEVELS,
  WEBSITE_QUALITY_WEIGHTS,
  WEBSITE_STATUS,
  REDESIGN_POTENTIAL_FACTORS,
  REDESIGN_LEVELS,
  AI_SALES_COMPONENTS,
  SCRAPING_SOURCES,
  CRM_STAGES,
  OUTREACH_FLOW,
  FOLLOWUP_SEQUENCE,
  AUTOMATION_FLOW,
  ARCHITECTURE_LAYERS,
  PROJECT_FLOW_STAGES,
  PROJECT_FLOW_DETAILS,
} from "@/data/logicModuleData";

type LeadScoreWeightKey = keyof typeof LEAD_SCORE_WEIGHTS;
type LeadQualKey = keyof typeof LEAD_QUALIFICATION;

function ProgressBar({ value, color, label }: { value: number; color: string; label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-medium text-[#52525B]">{label}</span>
          <span className="text-[12px] font-bold" style={{ color }}>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-2.5 rounded-full bg-[#F1F0EC] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
          }}
        >
          <div className="absolute inset-0 bg-white/20" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

function FormulaBlock({ formula }: { formula: string }) {
  return (
    <div className="bg-[#FAFAF8] border border-[#E4E1DB] rounded-xl px-5 py-4 font-mono text-[13px] text-[#52525B] leading-relaxed relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[#3B60E4] to-[#1D4ED8]" />
      <div className="pl-3">{formula}</div>
    </div>
  );
}

function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center rounded-xl border border-[#E4E1DB] p-4 bg-white transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
      <div className="text-[28px] font-bold tracking-tight mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[12px] font-medium text-[#74726E]">{label}</div>
    </div>
  );
}

function ViewRawLogicModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-[#E4E1DB] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8E5DF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] flex items-center justify-center">
              <ScrollText className="h-4.5 w-4.5 text-[#1D4ED8]" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#18181B]">Raw Business Logic</h2>
              <p className="text-[11.5px] text-[#74726E]">Formulas, equations & business rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[#F1F0EC] text-[#52525B] transition-colors"
          >
            <XCircle className="h-4.5 w-4.5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-4">
          {[
            { title: "Lead Score Formula", formula: "Final Score = (SEO × 0.15) + (UI/UX × 0.15) + (Responsive × 0.15) + (Trust × 0.15) + (Social × 0.10) + (Quality × 0.10) + (Freshness × 0.05) + (Contact × 0.05) + (Activity × 0.10)" },
            { title: "Base Lead Score (Scraper Level)", formula: "Base = 30 + (Website ? 20 : 0) + (Phone ? 10 : 0) + (Email ? 10 : 0) + (Rating ≥ 4.5 ? 10 : 0) + (Reviews ≥ 50 ? 5 : 0) [Max: 100]" },
            { title: "SEO Score Components", formula: "Title(20) + Meta(20) + H1(15) + AltTags(15) + InternalLinks(10) + Mobile(10) + SSL(10) = 100" },
            { title: "Website Quality Score", formula: "= SEO(20%) + Responsiveness(20%) + UI/UX(20%) + Trust(15%) + Performance(15%) + Social(10%)" },
            { title: "Opportunity Score", formula: "PoorSEO(+15) + OutdatedUI(+20) + NotMobile(+15) + WeakSocial(+10) + NoSSL(+10) + NoContactForm(+10) + OldCopyright(+10) + LowTrust(+15) + LowQuality(+15) + VeryOutdated(+20) + NeedsRefresh(+10)" },
            { title: "Conversion Probability", formula: "= TrustScore×0.25 + WebsiteQuality×0.25 + SEOQuality×0.20 + MobileResponsive×0.15 + SocialPresence×0.15" },
            { title: "Qualification Rules", formula: "High Potential: Score ≥ 85\nMedium Potential: Score 60-84\nLow Potential: Score < 60\nHigher Scores = Better Quality = Lower Opportunity\nLower Scores = Worse Quality = Higher Opportunity" },
          ].map((item, idx) => (
            <div key={idx}>
              <h3 className="text-[13px] font-semibold text-[#18181B] mb-2">{item.title}</h3>
              <FormulaBlock formula={item.formula} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "flow-of-project", label: "Flow of Project", icon: Layers, color: "#6366F1" },
  { id: "lead-score", label: "Lead Score", icon: Target, color: "#1D4ED8" },
  { id: "seo-analysis", label: "SEO", icon: Search, color: "#3B82F6" },
  { id: "responsive-ux", label: "Responsive", icon: Smartphone, color: "#10B981" },
  { id: "business-intelligence", label: "BI Engine", icon: BarChart3, color: "#F59E0B" },
  { id: "scraping", label: "Scraping", icon: Globe, color: "#8B5CF6" },
  { id: "automation", label: "Automation", icon: Zap, color: "#EC4899" },
  { id: "crm", label: "CRM", icon: Workflow, color: "#06B6D4" },
  { id: "ai-sales", label: "AI Sales", icon: Sparkles, color: "#EF4444" },
  { id: "outreach", label: "Outreach", icon: Send, color: "#16A34A" },
  { id: "architecture", label: "Architecture", icon: Server, color: "#F97316" },
] as const;

export default function LogicModulePage() {
  const [activeSection, setActiveSection] = useState("");
  const [rawLogicOpen, setRawLogicOpen] = useState(false);

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const weightEntries = Object.entries(LEAD_SCORE_WEIGHTS) as [LeadScoreWeightKey, typeof LEAD_SCORE_WEIGHTS[LeadScoreWeightKey]][];
  const qualEntries = Object.entries(LEAD_QUALIFICATION) as [LeadQualKey, typeof LEAD_QUALIFICATION[LeadQualKey]][];

  const oppLevels = [...OPPORTUNITY_LEVELS];
  const redesignLevels = [...REDESIGN_LEVELS];

  const activeColor = useMemo(() => {
    const found = SECTIONS.find((s) => s.id === activeSection);
    return found?.color || "#1D4ED8";
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] overflow-x-hidden w-full max-w-full">
      <style>{`
        @keyframes flowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="sticky top-0 z-30 bg-[#FAFAF8]/90 backdrop-blur-xl border-b border-[#E8E5DF]">
        <div className="max-w-[1280px] mx-auto px-5 py-3">
          <div className="flex items-start sm:items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <h1 className="text-[20px] font-bold text-[#18181B] tracking-tight whitespace-nowrap">Logic Module</h1>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                  color: "#1D4ED8",
                  border: "1px solid #C7D2FE",
                }}
              >
                AI Powered System Architecture
              </span>
            </div>
            <button
              onClick={() => setRawLogicOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 hover:scale-105 active:scale-95 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #3B60E4, #1D4ED8)",
                color: "white",
                boxShadow: "0 2px 10px rgba(29,78,216,0.3)",
              }}
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.5} />
              View Raw Logic
            </button>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto md:overflow-x-visible md:flex-wrap pb-1 scrollbar-none">
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSectionClick(s.id)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0"
                  style={{
                    backgroundColor: isActive ? `${s.color}12` : "transparent",
                    color: isActive ? s.color : "#52525B",
                    border: `1px solid ${isActive ? `${s.color}25` : "transparent"}`,
                  }}
                >
                  <s.icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 py-8 space-y-10">
        <EngineSection
          id="flow-of-project"
          title="Flow of the Project"
          subtitle="Complete end-to-end data pipeline from target definition to AI-powered outreach and deal closure"
          icon={<Layers className="h-5 w-5.5 text-[#6366F1]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)"
          accentColor="#6366F1"
        >
          <div className="space-y-8">
            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-5">
              <h4 className="text-[13px] font-semibold text-[#18181B] mb-4">Pipeline Overview</h4>
              <LogicFlow
                steps={PROJECT_FLOW_STAGES.map((s) => ({
                  name: s.name,
                  description: s.description,
                  color: s.color,
                }))}
                direction="vertical"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LogicCard title={PROJECT_FLOW_DETAILS.scraping.title} icon={<Globe className="h-4 w-4 text-[#8B5CF6]" />}>
                <div className="space-y-4 mt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">Sources</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {PROJECT_FLOW_DETAILS.scraping.sources.map((src) => (
                        <span key={src} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE]">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">Extracted Fields</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {PROJECT_FLOW_DETAILS.scraping.fields.map((f) => (
                        <span key={f} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F0F9FF] text-[#2563EB] border border-[#E0F2FE]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#52525B]">
                    <Cpu className="h-3.5 w-3.5 text-[#8B5CF6]" strokeWidth={2} />
                    <span className="font-medium">Engine:</span> {PROJECT_FLOW_DETAILS.scraping.tech}
                  </div>
                </div>
              </LogicCard>

              <LogicCard title={PROJECT_FLOW_DETAILS.analysis.title} icon={<BarChart3 className="h-4 w-4 text-[#F59E0B]" />}>
                <div className="space-y-2.5 mt-2">
                  {PROJECT_FLOW_DETAILS.analysis.dimensions.map((d) => (
                    <div key={d.name} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-3.5 py-2 bg-white">
                      <div>
                        <span className="text-[12px] font-semibold text-[#18181B]">{d.name}</span>
                        <div className="text-[10px] text-[#74726E]">{d.description}</div>
                      </div>
                      <span className="text-[12px] font-bold text-[#F59E0B]">{d.weight}</span>
                    </div>
                  ))}
                </div>
              </LogicCard>

              <LogicCard title={PROJECT_FLOW_DETAILS.scoring.title} icon={<Target className="h-4 w-4 text-[#1D4ED8]" />}>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-3 text-[12px] text-[#52525B]">
                    <span className="font-semibold text-[#18181B]">Base Score:</span>
                    <span className="text-[18px] font-bold text-[#1D4ED8]">{PROJECT_FLOW_DETAILS.scoring.baseScore}</span>
                  </div>
                  <div className="space-y-1">
                    {PROJECT_FLOW_DETAILS.scoring.bonuses.map((b) => (
                      <div key={b.name} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-3.5 py-1.5 bg-white">
                        <span className="text-[11.5px] text-[#52525B]">{b.name}</span>
                        <span className="text-[12px] font-bold text-[#10B981]">+{b.points}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-[#E4E1DB]">
                    {PROJECT_FLOW_DETAILS.scoring.tiers.map((t) => (
                      <div key={t.name} className="flex items-center gap-1.5 text-[11px]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="font-semibold text-[#18181B]">{t.name}</span>
                        <span className="text-[#74726E]">({t.range})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </LogicCard>

              <LogicCard title={PROJECT_FLOW_DETAILS.crm.title} icon={<Workflow className="h-4 w-4 text-[#06B6D4]" />}>
                <div className="space-y-3 mt-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">Pipeline Stages</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {PROJECT_FLOW_DETAILS.crm.stages.map((stg) => (
                        <span key={stg} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-[#ECFEFF] text-[#0891B2] border border-[#CFFAFE]">
                          {stg}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#52525B] uppercase tracking-wider">Outreach Flow</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {PROJECT_FLOW_DETAILS.crm.outreach.map((o) => (
                        <span key={o} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]">
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </LogicCard>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-xl bg-[#FAFAF8] border border-[#E4E1DB]">
                <div className="flex items-center gap-2 text-[12px] text-[#52525B]">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A]" strokeWidth={2} />
                  <span><strong className="text-[#18181B]">8 Stages</strong> from target to deal</span>
                </div>
                <div className="h-4 w-[1px] bg-[#E4E1DB]" />
                <div className="flex items-center gap-2 text-[12px] text-[#52525B]">
                  <Zap className="h-4 w-4 text-[#8B5CF6]" strokeWidth={2} />
                  <span><strong className="text-[#18181B]">3 Sources</strong> scraped concurrently</span>
                </div>
                <div className="h-4 w-[1px] bg-[#E4E1DB]" />
                <div className="flex items-center gap-2 text-[12px] text-[#52525B]">
                  <BrainCircuit className="h-4 w-4 text-[#F59E0B]" strokeWidth={2} />
                  <span><strong className="text-[#18181B]">6 AI Dimensions</strong> scored per lead</span>
                </div>
              </div>
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="lead-score"
          title="Lead Score Engine"
          subtitle="Weighted multi-factor AI scoring system that evaluates leads across 9 dimensions to produce a final qualification score"
          icon={<Target className="h-5 w-5.5 text-[#1D4ED8]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)"
          accentColor="#1D4ED8"
        >
          <div className="space-y-8">
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
              {weightEntries.map(([key, w]) => {
                const colorMap: Record<string, string> = {
                  seo: "#3B82F6", uiux: "#8B5CF6", responsive: "#10B981", trust: "#F59E0B",
                  socialPresence: "#EC4899", websiteQuality: "#06B6D4", freshness: "#84CC16",
                  contactMethods: "#F97316", activity: "#6366F1",
                };
                return (
                  <ScoreMeter key={key} score={w.maxPoints} label={w.label} color={colorMap[key] || "#6366F1"} size="sm" />
                );
              })}
            </div>

            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-5">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-4 w-4 text-[#52525B]" strokeWidth={2} />
                <h4 className="text-[13px] font-semibold text-[#18181B]">Weighted Distribution</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weightEntries.map(([key, w]) => {
                  const colorMap: Record<string, string> = {
                    seo: "#3B82F6", uiux: "#8B5CF6", responsive: "#10B981", trust: "#F59E0B",
                    socialPresence: "#EC4899", websiteQuality: "#06B6D4", freshness: "#84CC16",
                    contactMethods: "#F97316", activity: "#6366F1",
                  };
                  return (
                    <ProgressBar key={key} value={w.weight * 100} color={colorMap[key] || "#6366F1"} label={`${w.label} (${Math.round(w.weight * 100)}%)`} />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {qualEntries.map(([key, q]) => (
                <div key={key} className="rounded-xl border border-[#E4E1DB] p-5 bg-white text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                  <div className="text-[26px] font-bold mb-1" style={{ color: q.color }}>{q.minScore}+</div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: q.color }} />
                    <span className="text-[13.5px] font-semibold text-[#18181B]">{q.label}</span>
                  </div>
                  <p className="text-[12px] text-[#74726E]">{q.description}</p>
                </div>
              ))}
            </div>

            <FormulaBlock formula="Final Score = (SEO × 0.15) + (UI/UX × 0.15) + (Responsive × 0.15) + (Trust × 0.15) + (Social × 0.10) + (Quality × 0.10) + (Freshness × 0.05) + (Contact × 0.05) + (Activity × 0.10)" />

            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-5">
              <h4 className="text-[13px] font-semibold text-[#18181B] mb-4">Scoring Pipeline</h4>
              <LogicFlow
                steps={[
                  { name: "Scraped Data", color: "#6B7280" },
                  { name: "SEO Analysis", color: "#3B82F6" },
                  { name: "Responsive Analysis", color: "#10B981" },
                  { name: "Trust Score", color: "#F59E0B" },
                  { name: "AI Weight Engine", color: "#8B5CF6" },
                  { name: "Final Lead Score", color: "#1D4ED8" },
                ]}
              />
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="seo-analysis"
          title="SEO Analysis Engine"
          subtitle="Evaluates 7 critical on-page SEO factors with weighted scoring to determine search engine optimization quality"
          icon={<Search className="h-5 w-5.5 text-[#3B82F6]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)"
          accentColor="#3B82F6"
        >
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
              {SEO_SCORE_COMPONENTS.map((comp) => (
                <div
                  key={comp.name}
                  className="rounded-xl border border-[#E4E1DB] p-4 bg-white transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  style={{ borderTop: `3px solid ${comp.color}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11.5px] font-semibold text-[#18181B]">{comp.name}</span>
                    <span className="text-[18px] font-bold" style={{ color: comp.color }}>{comp.maxPoints}</span>
                  </div>
                  <p className="text-[11px] text-[#74726E] leading-snug">{comp.criteria}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#F1F0EC] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${comp.maxPoints}%`, backgroundColor: comp.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-5">
              <h4 className="text-[13px] font-semibold text-[#18181B] mb-3">SEO Grade Scale</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {SEO_GRADE_SCALE.map((g) => (
                  <div key={g.grade} className="flex items-center gap-2.5 rounded-lg border border-[#E4E1DB] p-3 bg-white">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: g.color }}>
                      {g.range}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-[#18181B]">{g.grade}</div>
                      <div className="text-[9.5px] text-[#74726E] leading-tight">{g.assessment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E4E1DB] p-4 bg-white">
                <h4 className="text-[12px] font-semibold text-[#18181B] mb-3">Score Distribution</h4>
                <ProgressBar value={92} color="#3B82F6" label="Sample SEO Score" />
              </div>
              <div className="rounded-xl border border-[#E4E1DB] p-4 bg-white">
                <h4 className="text-[12px] font-semibold text-[#18181B] mb-3">Quick Checklist</h4>
                <div className="space-y-1.5">
                  {[
                    "Title tag 30-60 chars",
                    "Meta desc 120-160 chars",
                    "Exactly one H1 tag",
                    "Alt attributes on images",
                    "5+ internal links",
                    "Viewport meta tag",
                    "SSL/HTTPS enabled",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[12px] text-[#52525B]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="responsive-ux"
          title="Responsive + UI/UX Engine"
          subtitle="Analyzes mobile responsiveness, viewport configuration, touch-friendliness, and overall user experience quality"
          icon={<Smartphone className="h-5 w-5.5 text-[#10B981]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
          accentColor="#10B981"
        >
          <div className="space-y-8">
            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-5">
              <h4 className="text-[13px] font-semibold text-[#18181B] mb-4">Device Flow Analysis</h4>
              <LogicFlow
                steps={[
                  { name: "Desktop", description: "Full layout analysis", color: "#3B82F6" },
                  { name: "Tablet", description: "Responsive breakpoints", color: "#8B5CF6" },
                  { name: "Mobile", description: "Touch-friendly check", color: "#10B981" },
                ]}
                direction="horizontal"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-[#EF4444]" strokeWidth={2} />
                  <h4 className="text-[13px] font-semibold text-[#18181B]">Score Deductions</h4>
                </div>
                <div className="space-y-1.5">
                  {RESPONSIVE_DEDUCTIONS.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-4 py-2.5 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.category === "Responsive" ? "#EF4444" : "#F59E0B" }} />
                        <span className="text-[12px] text-[#52525B]">{d.name}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#EF4444]">-{d.deduction}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="h-4 w-4 text-[#10B981]" strokeWidth={2} />
                  <h4 className="text-[13px] font-semibold text-[#18181B]">Score Levels</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {RESPONSIVE_SCORE_LEVELS.map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-4 py-3 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-[12px] font-semibold text-[#18181B]">{l.label}</span>
                      </div>
                      <span className="text-[13px] font-bold" style={{ color: l.color }}>{l.minScore}+ points</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="business-intelligence"
          title="Business Intelligence Engine"
          subtitle="Advanced trust scoring, opportunity detection, and comprehensive website quality assessment"
          icon={<BarChart3 className="h-5 w-5.5 text-[#F59E0B]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
          accentColor="#F59E0B"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <LogicCard title="Trust Score Factors" icon={<Shield className="h-4 w-4 text-[#F59E0B]" />}>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {TRUST_SCORE_FACTORS.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-3.5 py-2 bg-white">
                      <span className="text-[11.5px] text-[#52525B]">{f.name}</span>
                      <span className="text-[12px] font-bold" style={{ color: f.type === "bonus" ? "#10B981" : "#1D4ED8" }}>+{f.points}</span>
                    </div>
                  ))}
                </div>
              </LogicCard>

              <LogicCard title="Opportunity Detection" icon={<TrendingUp className="h-4 w-4 text-[#EF4444]" />}>
                <div className="grid grid-cols-1 gap-1.5 mt-2">
                  {OPPORTUNITY_DETECTION_FACTORS.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-3.5 py-2 bg-white">
                      <span className="text-[11.5px] text-[#52525B]">{f.condition}</span>
                      <span className="text-[12px] font-bold text-[#EF4444]">+{f.points}</span>
                    </div>
                  ))}
                </div>
              </LogicCard>

              <LogicCard title="Website Quality Weights" icon={<Globe className="h-4 w-4 text-[#06B6D4]" />}>
                <div className="space-y-2 mt-2">
                  {WEBSITE_QUALITY_WEIGHTS.map((w) => (
                    <ProgressBar key={w.name} value={w.weight * 100} color={w.color} label={`${w.name} (${Math.round(w.weight * 100)}%)`} />
                  ))}
                </div>
              </LogicCard>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WEBSITE_STATUS.map((s) => (
                <div key={s.label} className="text-center rounded-xl border border-[#E4E1DB] p-4 bg-white transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                  <div className="text-[20px] font-bold mb-0.5" style={{ color: s.color }}>{s.minScore}+</div>
                  <div className="text-[12px] font-semibold text-[#18181B]">{s.label}</div>
                  <div className="text-[10px] text-[#74726E] mt-1 leading-tight">{s.checks}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {oppLevels.map((l, idx) => (
                <div key={idx} className="text-center rounded-xl border border-[#E4E1DB] p-5 bg-white">
                  <div className="text-[26px] font-bold mb-1" style={{ color: l.color }}>{l.minScore}+</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-[13.5px] font-semibold text-[#18181B]">{l.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="scraping"
          title="Scraping Engine"
          subtitle="Multi-source data extraction pipeline with intelligent deduplication and lead normalization"
          icon={<Globe className="h-5 w-5.5 text-[#8B5CF6]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)"
          accentColor="#8B5CF6"
        >
          <div className="max-w-xl mx-auto">
            <AnimatedPipeline
              stages={[
                ...SCRAPING_SOURCES.map((s) => ({ name: s.name, color: s.color })),
                { name: "Data Extraction", color: "#8B5CF6" },
                { name: "Duplicate Removal", color: "#F59E0B" },
                { name: "Lead Normalization", color: "#10B981" },
                { name: "Lead Storage", color: "#06B6D4" },
                { name: "AI Processing", color: "#EC4899" },
              ]}
            />
          </div>
        </EngineSection>

        <EngineSection
          id="automation"
          title="Area Automation Engine"
          subtitle="Automated state-to-area scraping with queue-based sequential job processing, stop/resume capability"
          icon={<Zap className="h-5 w-5.5 text-[#EC4899]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)"
          accentColor="#EC4899"
        >
          <div className="space-y-8">
            <div className="max-w-md mx-auto">
              <LogicFlow
                steps={AUTOMATION_FLOW.map((f, idx) => ({
                  name: f.name,
                  description: f.description,
                  color: ["#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"][idx],
                }))}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Completed Jobs", value: "0", color: "#16A34A" },
                { label: "Skipped Jobs", value: "0", color: "#F59E0B" },
                { label: "Running Jobs", value: "0", color: "#3B82F6" },
                { label: "Resumed Jobs", value: "0", color: "#8B5CF6" },
              ].map((stat) => (
                <StatBadge key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E4E1DB] p-5 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
                  <h4 className="text-[13px] font-semibold text-[#18181B]">Stop Flow</h4>
                </div>
                <div className="space-y-2">
                  {["Set stopRequested flag for session", "Wait for current job to complete", "Mark remaining jobs as skipped", "Set session status to completed"].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[12px] text-[#52525B]">
                      <div className="h-6 w-6 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[11px] font-bold text-[#EF4444] flex-shrink-0">{idx + 1}</div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#E4E1DB] p-5 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-4 w-4 text-[#10B981]" strokeWidth={2} />
                  <h4 className="text-[13px] font-semibold text-[#18181B]">Resume Flow</h4>
                </div>
                <div className="space-y-2">
                  {["Find skipped jobs for session", "Reset skipped → pending status", "Reset session status to running", "Re-enter same processing loop"].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[12px] text-[#52525B]">
                      <div className="h-6 w-6 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[11px] font-bold text-[#10B981] flex-shrink-0">{idx + 1}</div>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="crm"
          title="CRM Pipeline Engine"
          subtitle="End-to-end lead pipeline from first contact to deal closure with automated stage transitions"
          icon={<Workflow className="h-5 w-5.5 text-[#06B6D4]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)"
          accentColor="#06B6D4"
        >
          <div className="space-y-8">
            <div className="bg-[#FAFAF8] rounded-xl border border-[#E4E1DB] p-3 sm:p-5 overflow-x-auto">
              <h4 className="text-[13px] font-semibold text-[#18181B] mb-4">Pipeline Stages</h4>
              <div className="flex flex-wrap gap-1.5">
                {CRM_STAGES.map((stage, idx) => (
                  <div key={stage.name} className="flex items-center gap-1">
                    <div className="px-3.5 py-2 rounded-lg text-[11.5px] font-semibold text-white shadow-sm transition-all hover:scale-105" style={{ backgroundColor: stage.color }}>
                      {stage.name}
                    </div>
                    {idx < CRM_STAGES.length - 1 && (
                      <div className="flex items-center">
                        <div className="w-3.5 h-[2px] bg-[#D4D2CC]" />
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" className="-ml-[3px]">
                          <path d="M0 0L7 3.5L0 7Z" fill="#D4D2CC" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Conversion Rate", value: "0%", color: "#16A34A" },
                { label: "Avg. Deal Value", value: "$0", color: "#3B82F6" },
                { label: "Pipeline Value", value: "$0", color: "#8B5CF6" },
                { label: "Win Rate", value: "0%", color: "#10B981" },
                { label: "Loss Rate", value: "0%", color: "#EF4444" },
              ].map((stat) => (
                <StatBadge key={stat.label} value={stat.value} label={stat.label} color={stat.color} />
              ))}
            </div>

            <LogicCard title="Stage Transition Rules" icon={<Workflow className="h-4 w-4 text-[#06B6D4]" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {([
                  'Interest = "interested" → interested stage',
                  'Interest = "not-interested" → not-interested stage',
                  'Interest = "maybe-later" → follow-up stage',
                  'Contact = "contacted" → contacted stage',
                  "Follow-up date set → follow-up stage",
                  'Proposal = "pending/sent" → proposal-sent',
                  'Proposal = "approved" → negotiation',
                  'Proposal = "rejected" → deal-lost',
                  'Meeting = "scheduled" → meeting-scheduled',
                ] as string[]).map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 rounded-lg border border-[#E4E1DB] px-4 py-2.5 bg-white text-[12px] text-[#52525B]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {rule}
                  </div>
                ))}
              </div>
            </LogicCard>
          </div>
        </EngineSection>

        <EngineSection
          id="ai-sales"
          title="AI Sales Engine"
          subtitle="Intelligent sales opportunity scoring with redesign potential, conversion probability, and revenue forecasting"
          icon={<Sparkles className="h-5 w-5.5 text-[#EF4444]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)"
          accentColor="#EF4444"
        >
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {AI_SALES_COMPONENTS.map((comp) => (
                <div key={comp.name} className="rounded-xl border border-[#E4E1DB] p-5 bg-white text-center transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${comp.color}15` }}>
                    {comp.name === "Redesign Opportunity" && <Palette className="h-5 w-5" style={{ color: comp.color }} />}
                    {comp.name === "SEO Opportunity" && <Search className="h-5 w-5" style={{ color: comp.color }} />}
                    {comp.name === "Conversion Probability" && <TrendingUp className="h-5 w-5" style={{ color: comp.color }} />}
                    {comp.name === "Revenue Potential" && <DollarSign className="h-5 w-5" style={{ color: comp.color }} />}
                    {comp.name === "Sales Priority" && <Flag className="h-5 w-5" style={{ color: comp.color }} />}
                    {comp.name === "AI Recommendations" && <Cpu className="h-5 w-5" style={{ color: comp.color }} />}
                  </div>
                  <span className="text-[12px] font-semibold text-[#18181B]">{comp.name}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {redesignLevels.map((l, idx) => (
                <div key={idx} className="text-center rounded-xl border border-[#E4E1DB] p-5 bg-white">
                  <div className="text-[26px] font-bold mb-1" style={{ color: l.color }}>{l.minScore}+</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-[13.5px] font-semibold text-[#18181B]">{l.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <LogicCard title="Redesign Potential Factors" icon={<Palette className="h-4 w-4 text-[#8B5CF6]" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                {REDESIGN_POTENTIAL_FACTORS.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-[#E4E1DB] px-3.5 py-2 bg-white">
                    <span className="text-[11.5px] text-[#52525B]">{f.condition}</span>
                    <span className="text-[12px] font-bold text-[#8B5CF6]">+{f.points}</span>
                  </div>
                ))}
              </div>
            </LogicCard>

            <FormulaBlock formula="Redesign Potential = ResponsiveIssues + UXIssues + AgeIndicators + StructureIssues + CopyrightAge [Max: 150+ points]" />
          </div>
        </EngineSection>

        <EngineSection
          id="outreach"
          title="Outreach Engine"
          subtitle="AI-powered multi-channel personalized outreach with intelligent follow-up sequencing"
          icon={<Send className="h-5 w-5.5 text-[#16A34A]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
          accentColor="#16A34A"
        >
          <div className="space-y-8">
            <div className="max-w-lg mx-auto">
              <LogicFlow
                steps={OUTREACH_FLOW.map((f, idx) => ({
                  name: f.stage,
                  description: f.description,
                  color: ["#6B7280", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"][idx],
                }))}
              />
            </div>

            <LogicCard title="Follow-up Sequence" icon={<Mail className="h-4 w-4 text-[#EC4899]" />}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                {FOLLOWUP_SEQUENCE.map((step) => (
                  <div key={step.stage} className="rounded-xl border border-[#E4E1DB] p-4 bg-white text-center transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                    <div className="text-[22px] font-bold text-[#1D4ED8] mb-1">#{step.stage}</div>
                    <div className="text-[12px] font-semibold text-[#18181B]">{step.name}</div>
                    <div className="text-[11px] text-[#74726E] mt-0.5">{step.delay}</div>
                    <div className="text-[10.5px] font-medium text-[#3B82F6] mt-1 bg-[#EEF2FF] rounded-full px-2 py-0.5 inline-block">{step.type}</div>
                  </div>
                ))}
              </div>
            </LogicCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E4E1DB] p-5 bg-white">
                <h4 className="text-[13px] font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#16A34A]" strokeWidth={2} />
                  Maturity Labels
                </h4>
                <div className="space-y-2">
                  {([
                    { label: "Advanced", condition: "AI score >= 70 OR Trust >= 70", color: "#16A34A" },
                    { label: "Developing", condition: "AI score >= 40 OR Trust >= 40", color: "#F59E0B" },
                    { label: "Basic", condition: "Otherwise", color: "#6B7280" },
                  ] as { label: string; condition: string; color: string }[]).map((m) => (
                    <div key={m.label} className="flex items-center gap-3 text-[12px] text-[#52525B]">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="font-semibold text-[#18181B] min-w-[80px]">{m.label}:</span>
                      <span>{m.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#E4E1DB] p-5 bg-white">
                <h4 className="text-[13px] font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#16A34A]" strokeWidth={2} />
                  Service Focus
                </h4>
                <div className="space-y-2 text-[12px] text-[#52525B]">
                  {[
                    { service: "Responsive redesign", condition: "responsiveScore < 50" },
                    { service: "SEO optimization", condition: "seoOpportunity = high" },
                    { service: "Quality improvement", condition: "qualityScore < 50" },
                    { service: "Social media growth", condition: "socialScore < 40" },
                    { service: "Comprehensive strategy", condition: "Otherwise" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                      <span className="font-medium">{item.service}:</span>
                      <span>{item.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </EngineSection>

        <EngineSection
          id="architecture"
          title="System Architecture"
          subtitle="Full-stack architecture showing the complete data flow across all layers of the LeadFinder system"
          icon={<Server className="h-5 w-5.5 text-[#F97316]" strokeWidth={2.2} />}
          gradient="linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)"
          accentColor="#F97316"
        >
          <div className="space-y-8">
            <ArchitectureGraph layers={ARCHITECTURE_LAYERS} />

          </div>
        </EngineSection>
      </div>

      <ViewRawLogicModal open={rawLogicOpen} onClose={() => setRawLogicOpen(false)} />
    </div>
  );
}
