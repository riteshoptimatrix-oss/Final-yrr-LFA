"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ArrowRight,
  Loader2,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  XCircle,
  Copy,
  MapPin,
  TrendingUp,
  Play,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { useSearchLeads } from "@/hooks/useLeads";
import { LocationSelector, type LocationSelection } from "@/components/location/LocationSelector";
import type { GeographyCountry, GeographyState, GeographyCity, GeographyArea } from "@/types/geography";
import { useSearchStore } from "@/store/useSearchStore";
import { useSearchAlertStore } from "@/store/useSearchAlertStore";
import { useSearchSocket } from "@/hooks/useSearchSocket";
import { scraperService } from "@/services/scraper.service";
import { leadService } from "@/services/lead.service";
import { buildLocationString } from "@/utils/location-query-builder";
import { SearchHistory } from "@/components/search/search-history";
import { LeadLocationSummary } from "@/components/search/lead-location-summary";
import type { ScrapingProgressData, SemanticQueryProgress } from "@/services/scraper.service";
import type { SemanticExpansionInfo } from "@/types/index";

const SOURCE_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  "google-maps": { emoji: "🗺️", color: "#EA4335", bg: "#FEF2F2", border: "#FECACA" },
  justdial:      { emoji: "📞", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  indiamart:     { emoji: "🛒", color: "#15803D", bg: "#F0FBF4", border: "#BBF7D0" },
  clutch:        { emoji: "⭐", color: "#1D4ED8", bg: "#EEF2FF", border: "#C7D2FE" },
};

const METRIC_CARDS = [
  { key: "totalFound" as const, label: "Found", icon: TrendingUp, color: "#1D4ED8", bg: "#EEF2FF" },
  { key: "totalSaved" as const, label: "Saved", icon: Database, color: "#15803D", bg: "#F0FBF4" },
  { key: "totalDuplicates" as const, label: "Duplicates", icon: Copy, color: "#D97706", bg: "#FFFBEB" },
  { key: "totalRejected" as const, label: "Rejected", icon: XCircle, color: "#DC2626", bg: "#FEF2F2" },
];

export default function SearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["google-maps"]);
  const [searchProgress, setSearchProgress] = useState("");
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [progressStats, setProgressStats] = useState<ScrapingProgressData | null>(null);
  const [showPartialSuccess, setShowPartialSuccess] = useState(false);
  const [showSemanticProgress, setShowSemanticProgress] = useState(false);
  const [restoredSession, setRestoredSession] = useState<{ sessionId: string; keyword: string; location: string; country?: string; state?: string; city?: string; area?: string; sources: string[] } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const sessionIdRef = useRef<string>("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { searchLeads, isLoading, isSuccess, error: searchError, reset } = useSearchLeads();

  const { country, setCountry, location, setLocation } = useSearchStore();
  const { state, city, area } = location;

  const [selectedCountryObj, setSelectedCountryObj] = useState<GeographyCountry | null>(null);
  const [selectedStateObj, setSelectedStateObj] = useState<GeographyState | null>(null);
  const [selectedCityObj, setSelectedCityObj] = useState<GeographyCity | null>(null);
  const [selectedAreaObj, setSelectedAreaObj] = useState<GeographyArea | null>(null);

  const handleLocationChange = useCallback((selection: LocationSelection) => {
    setSelectedCountryObj(selection.country);
    setSelectedStateObj(selection.state);
    setSelectedCityObj(selection.city);
    setSelectedAreaObj(selection.area);
    setCountry(selection.country?.name || '');
    setLocation({
      state: selection.state?.name || '',
      city: selection.city?.name || '',
      area: selection.area?.name || '',
    });
  }, [setCountry, setLocation]);

  const [sourceStatus, setSourceStatus] = useState<Record<string, "pending" | "searching" | "completed" | "failed">>({});
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [semanticInfo, setSemanticInfo] = useState<SemanticExpansionInfo | null>(null);
  const [showExpandedKeywords, setShowExpandedKeywords] = useState(false);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sources = [
    { id: "google-maps", label: "Google Maps" },
    { id: "justdial",    label: "Justdial"    },
    { id: "indiamart",   label: "IndiaMart"   },
    { id: "clutch",      label: "Clutch"      },
  ];

  const toggleSource = (sourceId: string) => {
    if (isLoading) return;
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || isLoading || isSuccess) return;

    const locationString = buildLocationString({
      area: area || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
    });

    if (!locationString) {
      toast.error("Please select a country and city before searching.");
      return;
    }

    reset();
    setSearchCompleted(false);
    setProgressStats(null);
    setRestoredSession(null);
    setElapsedSeconds(0);
    setSearchStartTime(Date.now());
    setProgressPercent(0);
    sessionIdRef.current = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const initialStatus: Record<string, "pending" | "searching" | "completed" | "failed"> = {};
    for (const src of selectedSources) {
      initialStatus[src] = "pending";
    }
    setSourceStatus(initialStatus);
    setSourceCounts({});

    setSearchProgress(
      `Starting search for "${keyword}" in "${locationString || "selected location"}"...`
    );

    const params = new URLSearchParams();
    if (keyword.trim()) params.append("keyword", keyword.trim());
    if (locationString) params.append("location", locationString);
    if (country) params.append("country", country);
    if (state) params.append("state", state);
    if (city) params.append("city", city);
    if (area) params.append("area", area);
    if (Array.isArray(selectedSources)) params.append("sources", selectedSources.join(','));
    params.append("sessionId", sessionIdRef.current);

    useSearchAlertStore.getState().startSearch({
      sessionId: sessionIdRef.current,
      keyword: keyword.trim(),
      location: locationString,
      country: country || "",
      state: state || "",
      city: city || "",
      area: area || "",
      sources: selectedSources,
    });

    router.push(`/leads?${params.toString()}`);

    leadService.searchLeads({
      keyword: keyword.trim(),
      location: locationString,
      country: country || undefined,
      state: state || undefined,
      city: city || undefined,
      area: area || undefined,
      businessType: keyword.trim(),
      sources: selectedSources,
      sessionId: sessionIdRef.current,
    }).catch((err) => {
      console.error("Search failed to start:", err);
    });
  };

  useEffect(() => {
    leadService.getActiveSession().then((res) => {
      if (res?.success && res?.data && res.data.sessionId) {
        const session = res.data;
        setRestoredSession({
          sessionId: session.sessionId,
          keyword: session.keyword || '',
          location: session.location || '',
          country: session.country,
          state: session.state,
          city: session.city,
          area: session.area,
          sources: session.sources || ['google-maps'],
        });
        sessionIdRef.current = session.sessionId;
        setKeyword(session.keyword || '');
        setSelectedSources(session.sources || ['google-maps']);
        if (session.country) setCountry(session.country);
        const startedAt = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
        setSearchStartTime(startedAt);
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        setProgressPercent(session.progressPercentage || 0);
        setProgressStats({
          sessionId: session.sessionId,
          keyword: session.keyword || '',
          location: session.location || '',
          state: session.state || '',
          city: session.city || '',
          area: session.area || '',
          businessType: '',
          status: 'running',
          totalFound: session.leadsFound || 0,
          totalScraped: 0,
          totalSaved: session.uniqueLeads || 0,
          totalDuplicates: session.duplicatesRemoved || 0,
          totalRejected: session.failedCount || 0,
          errors: [],
          startedAt: session.startedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }).catch(() => {});
  }, []);

  // WebSocket subscription for real-time progress
  useSearchSocket(sessionIdRef.current || restoredSession?.sessionId || null, {
    onProgress(data) {
      setProgressStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalFound: data.foundCount ?? prev.totalFound,
          totalSaved: data.savedCount ?? prev.totalSaved,
          totalDuplicates: data.duplicateCount ?? prev.totalDuplicates,
          totalRejected: data.failedCount ?? prev.totalRejected,
        };
      });
      
      setProgressPercent(data.progress ?? 0);
      setSearchProgress(
        `Found ${data.foundCount || 0} businesses · Saved ${data.savedCount || 0} · ` +
        `${data.duplicateCount || 0} duplicates`
      );
    },
    onCompleted(data) {
      setSearchCompleted(true);
      setProgressPercent(100);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setProgressStats((prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'completed' };
      });
      setRestoredSession(null);
    },
    onError() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    onTimeout(data) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSearchProgress(`Search timed out: ${data.error || 'Unknown error'}`);
      toast.error(data.error || 'Search timed out. Please try again.', { id: `search-${sessionIdRef.current || restoredSession?.sessionId}`, duration: 8000 });
    },
    onGoogleBlocked(data) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSearchProgress(`Search blocked by Google: ${data.error || 'Unknown error'}`);
      toast.error(data.error || 'Search blocked by Google. Please wait or change your IP.', { id: `search-${sessionIdRef.current || restoredSession?.sessionId}`, duration: 8000 });
    },
    onStart(data) {
      setSearchStartTime(Date.now());
      setElapsedSeconds(0);
      setSearchProgress(
        `Searching for "${data.keyword}"...`
      );
      setProgressStats({
        sessionId: sessionIdRef.current,
        keyword: data.keyword,
        location: data.location || '',
        state: '',
        city: '',
        area: '',
        businessType: '',
        status: 'running',
        totalFound: 0,
        totalScraped: 0,
        totalSaved: 0,
        totalDuplicates: 0,
        totalRejected: 0,
        errors: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
  });

  // Fallback REST polling (only for restored sessions or when WebSocket fails)
  useEffect(() => {
    const activeSessionId = restoredSession?.sessionId || sessionIdRef.current;
    if (restoredSession && activeSessionId) {
      const sessionId = activeSessionId;
      pollingRef.current = setInterval(async () => {
        try {
          const res = await leadService.getSearchSession(sessionId);
          if (res?.success && res?.data) {
            const d = res.data;
            setProgressStats({
              sessionId: d.searchSessionId,
              keyword: d.keyword || '',
              location: d.location || '',
              state: d.state || '',
              city: d.city || '',
              area: d.area || '',
              businessType: '',
              status: d.status || 'running',
              totalFound: d.totalFound || 0,
              totalScraped: 0,
              totalSaved: d.uniqueSaved || 0,
              totalDuplicates: d.duplicates || 0,
              totalRejected: d.failedCount || 0,
              errors: d.error ? [d.error] : [],
              startedAt: d.startedAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isPartialSuccess: d.partialSuccess,
            });
            setProgressPercent(d.progress ?? 0);
            setSearchProgress(
              `Found ${d.totalFound || 0} businesses · Saved ${d.uniqueSaved || 0} · ` +
              `${d.duplicates || 0} duplicates`
            );
            if (d.status !== "running") {
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setRestoredSession(null);
            }
          }
        } catch {
          // polling silently
        }
      }, 5000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [restoredSession]);

  // Elapsed time ticker
  useEffect(() => {
    if (!isLoading && !restoredSession) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (!searchStartTime && !restoredSession) return;
    const start = searchStartTime || (restoredSession ? Date.now() - (elapsedSeconds * 1000) : Date.now());
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, restoredSession, searchStartTime]);

  const handleRetry = () => {
    reset();
    setSearchProgress("");
    setSearchCompleted(false);
    setProgressStats(null);
    setRestoredSession(null);
    setElapsedSeconds(0);
    setSearchStartTime(null);
    setProgressPercent(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionIdRef.current = "";
  };

  const fetchSemanticExpand = useCallback(async (kw: string) => {
    if (!kw.trim() || kw.trim().length < 2) {
      setSemanticInfo(null);
      return;
    }
    try {
      const result = await leadService.expandKeywords(
        kw.trim(),
        selectedSources,
        state || undefined,
        city || undefined,
        area || undefined
      );
      setSemanticInfo(result);
    } catch {
      setSemanticInfo(null);
    }
  }, [selectedSources, state, city, area]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
    }
    if (value.trim().length >= 2) {
      expandTimerRef.current = setTimeout(() => {
        fetchSemanticExpand(value);
      }, 400);
    } else {
      setSemanticInfo(null);
    }
  };

  const labelCls = "block text-[12px] font-semibold uppercase tracking-[0.07em] text-[#8E8C86] mb-1.5";

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* ── Full-width Hero / Search Banner ───────────────────────────────── */}
      <div
        className="w-full border-b border-[#E8E5DF]"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8F7F4 100%)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-10 lg:py-14">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="h-10 w-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                boxShadow: "0 2px 10px rgba(29,78,216,0.25)",
              }}
            >
              <Search className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.02em] leading-tight">
                Find Business Leads
              </h1>
              <p className="text-[13px] text-[#8E8C86]">
                Search across Google Maps and top directories to discover real, verified leads
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Large search input */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0AEA8]"
                strokeWidth={1.8}
              />
              <input
                id="keyword"
                type="text"
                placeholder="Search for a business category... e.g., Salon, Restaurant, Dentist, Gym"
                className="w-full h-14 rounded-[14px] border border-[#E4E1DB] bg-white pl-12 pr-4
                           text-[15px] text-[#18181B] placeholder:text-[#B0AEA8]
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150
                           shadow-sm"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Filter bar: location + sources inline */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Location selects */}
              <div className="flex-1 min-w-0">
                <label className={labelCls}>
                  <MapPin className="h-3 w-3 inline mr-1" />
                  Location <span className="text-xs font-normal text-muted-foreground">(Area optional)</span>
                </label>
                <LocationSelector
                  value={{ country: selectedCountryObj, state: selectedStateObj, city: selectedCityObj, area: selectedAreaObj }}
                  onChange={handleLocationChange}
                  showCountry={true}
                  showState={true}
                  showCity={true}
                  showArea={true}
                  disabled={isLoading}
                />
              </div>

              {/* Source chips */}
              <div className="shrink-0">
                <label className={labelCls}>
                  <Globe className="h-3 w-3 inline mr-1" />
                  Sources
                </label>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => {
                    const meta = SOURCE_META[source.id];
                    const isChecked = selectedSources.includes(source.id);
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => toggleSource(source.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium
                                   transition-all duration-150 border disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: isChecked ? meta.bg : "#FAFAF8",
                          borderColor: isChecked ? meta.color : "#E4E1DB",
                          color: isChecked ? meta.color : "#52525B",
                        }}
                      >
                        <span className="text-[13px] leading-none">{meta.emoji}</span>
                        {source.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action row: CTA + error */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading || isSuccess || !keyword.trim()}
                className="h-11 px-6 rounded-[10px] text-[14px] font-semibold text-white
                           flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150 active:scale-[0.99] shrink-0"
                style={{
                  background:
                    isLoading || isSuccess
                      ? "#93A8F0"
                      : "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                  boxShadow:
                    isLoading || isSuccess
                      ? "none"
                      : "0 1px 6px rgba(29,78,216,0.3)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" strokeWidth={1.5} />
                    Search Now
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </>
                )}
              </button>

              {searchError && !searchCompleted && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA]">
                  <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" strokeWidth={1.8} />
                  <span className="text-[12px] text-[#DC2626]">
                    {searchError?.message?.includes("500") || searchError?.message?.includes("Internal")
                      ? "Search encountered an issue. Some results may have been saved."
                      : searchError?.message || "Search failed"}
                  </span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-[12px] font-medium text-[#DC2626] hover:text-[#B91C1C] ml-1 underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Semantic Expansion Preview */}
            {semanticInfo && !isLoading && !isSuccess && (
              <div
                className="rounded-[12px] border border-[#E8E5DF] bg-white overflow-hidden transition-all duration-200"
                style={{
                  borderColor: semanticInfo.matchedCategory ? '#C7D2FE' : '#FDE68A',
                  background: semanticInfo.matchedCategory ? '#F8FAFF' : '#FFFCF5',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowExpandedKeywords(!showExpandedKeywords)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded-[7px] flex items-center justify-center shrink-0"
                      style={{ background: semanticInfo.matchedCategory ? '#EEF2FF' : '#FEF3C7' }}
                    >
                      <Sparkles className="h-3.5 w-3.5" style={{ color: semanticInfo.matchedCategory ? '#1D4ED8' : '#D97706' }} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#18181B]">
                        {semanticInfo.matchedCategory
                          ? `Semantic Search: "${semanticInfo.originalKeyword}" will also search for`
                          : `Smart expansion for "${semanticInfo.originalKeyword}"`}
                      </p>
                      <p className="text-[11.5px] text-[#8E8C86] mt-0.5">
                        {semanticInfo.keywordsPreview.join(", ")}
                        {semanticInfo.totalExpandedKeywords > 5 && ` and ${semanticInfo.totalExpandedKeywords - 5} more`}
                        {" · "}{semanticInfo.totalQueries} total queries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {semanticInfo.matchedCategory && (
                      <span className="text-[10px] font-medium text-[#1D4ED8] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                        {semanticInfo.matchedCategory.name}
                      </span>
                    )}
                    {showExpandedKeywords ? (
                      <ChevronUp className="h-3.5 w-3.5 text-[#B0AEA8]" strokeWidth={2} />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-[#B0AEA8]" strokeWidth={2} />
                    )}
                  </div>
                </button>

                {showExpandedKeywords && (
                  <div className="px-4 pb-3 pt-1 border-t border-[#E8E5DF]">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {semanticInfo.expandedKeywords.map((ek, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-medium"
                          style={{
                            background: ek.isPrimary ? '#EEF2FF' : '#FAFAF8',
                            color: ek.isPrimary ? '#1D4ED8' : '#52525B',
                            border: `1px solid ${ek.isPrimary ? '#C7D2FE' : '#E4E1DB'}`,
                          }}
                        >
                          {ek.keyword}
                          {ek.isPrimary && (
                            <span className="text-[9px] font-semibold text-[#1D4ED8] ml-0.5">primary</span>
                          )}
                        </span>
                      ))}
                    </div>
                    {semanticInfo.totalExpandedKeywords > 20 && (
                      <p className="text-[10px] text-[#B0AEA8] mt-2">
                        Showing 20 of {semanticInfo.totalExpandedKeywords} semantic variants
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── Dashboard + Quick Search ─────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6 lg:py-8">
        {(isLoading || isSuccess || searchError || restoredSession) && progressStats ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main: Live Scraping Dashboard */}
            <div className="lg:col-span-2 space-y-5">
              {/* Metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {METRIC_CARDS.map((metric) => {
                  const value = progressStats[metric.key] ?? 0;
                  return (
                    <Card key={metric.key} className="border-[#E8E5DF] shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86]">
                            {metric.label}
                          </span>
                          <div
                            className="h-7 w-7 rounded-[7px] flex items-center justify-center"
                            style={{ background: metric.bg }}
                          >
                            <metric.icon className="h-3.5 w-3.5" style={{ color: metric.color }} strokeWidth={2} />
                          </div>
                        </div>
                        <p className="text-[24px] font-bold text-[#18181B] tracking-[-0.02em]">
                          {value.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Progress & source status */}
              <Card className="border-[#E8E5DF] shadow-sm">
                <CardContent className="p-5 space-y-4">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-[7px] flex items-center justify-center"
                        style={{ background: "#EEF2FF" }}
                      >
                        {isLoading || restoredSession ? (
                          <Loader2 className="h-3.5 w-3.5 text-[#1D4ED8] animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" strokeWidth={2} />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#18181B]">
                          {isLoading || restoredSession ? "Scraping in Progress" : "Search Complete"}
                        </p>
                        <p className="text-[12px] text-[#8E8C86]">{searchProgress}</p>
                      </div>
                    </div>
                    {(isLoading || restoredSession) && (
                      <span className="text-[11px] font-medium text-[#1D4ED8] bg-[#EEF2FF] px-2.5 py-1 rounded-full">
                        Live
                      </span>
                    )}
                  </div>

                  {/* Source-wise status */}
                  <div className="space-y-2">
                    {sources.filter(s => selectedSources.includes(s.id)).map((source) => {
                      const status = sourceStatus[source.id] || "idle";
                      const meta = SOURCE_META[source.id];
                      const count = sourceCounts[source.id] || 0;
                      return (
                        <div
                          key={source.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                          style={{ background: `${meta.bg}60` }}
                        >
                          <span className="text-[15px] leading-none">{meta.emoji}</span>
                          <span className="text-[12.5px] font-medium flex-1" style={{ color: meta.color }}>
                            {source.label}
                          </span>
                          {status === "searching" && (
                            <Loader2 className="h-3 w-3 text-[#1D4ED8] animate-spin" />
                          )}
                          {status === "completed" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
                          )}
                          {status === "failed" && (
                            <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />
                          )}
                          {status === "pending" && (
                            <Clock className="h-3.5 w-3.5 text-[#B0AEA8]" />
                          )}
                          {!status && (
                            <Clock className="h-3.5 w-3.5 text-[#D4D1CB]" />
                          )}
                          {count > 0 && (
                            <span className="text-[11px] font-semibold text-[#1D4ED8] min-w-[24px] text-right">
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar with real percentage */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#8E8C86] font-medium">Progress</span>
                      <span className="text-[11px] text-[#8E8C86]">
                        {progressPercent}% · {progressStats.totalFound} found · {progressStats.totalSaved} saved
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#E8E5DF] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          background: "linear-gradient(90deg, #3B60E4 0%, #1D4ED8 100%)",
                          width: `${Math.min(progressPercent || (isLoading || restoredSession ? 0 : 100), 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Elapsed time */}
                  <div className="flex items-center gap-2 text-[11px] text-[#8E8C86]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span>
                    {(progressStats.totalFound > 0 && progressPercent > 0) && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#D4D1CB]" />
                        <span>Estimated remaining: ~{progressPercent > 0 ? Math.max(1, Math.ceil((elapsedSeconds / progressPercent) * (100 - progressPercent))) : '?'}s</span>
                      </>
                    )}
                  </div>

                  {/* Partial success banner - removed, only show real progress now */}

                  {/* Success completion alert */}
                  {searchCompleted && progressStats && (
                    <div className="rounded-[12px] bg-[#F0FBF4] border border-[#BBF7D0] p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 text-[#15803D]" strokeWidth={2} />
                        <div>
                          <p className="text-[13px] font-semibold text-[#15803D]">Search Completed Successfully</p>
                          <p className="text-[11.5px] text-[#15803D]/70 mt-0.5">
                            {keyword} · {[state, city, area].filter(Boolean).join(' → ') || 'All locations'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-[#15803D]/80">
                        <span>{progressStats.totalSaved} leads</span>
                        <span className="h-1 w-1 rounded-full bg-[#15803D]/30" />
                        <span>{Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s duration</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('sessionId', sessionIdRef.current);
                            if (keyword) params.set('keyword', keyword);
                            router.push(`/leads?${params.toString()}`);
                          }}
                          className="h-8 px-4 rounded-[8px] bg-[#15803D] text-[11px] font-semibold text-white hover:bg-[#166534] transition-colors"
                        >
                          View Leads
                        </button>
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="h-8 px-4 rounded-[8px] border border-[#BBF7D0] text-[11px] font-semibold text-[#15803D] hover:bg-[#15803D]/5 transition-colors"
                        >
                          New Search
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams();
                            if (keyword) params.set('keyword', keyword);
                            if (state) params.set('state', state);
                            if (city) params.set('city', city);
                            if (area) params.set('area', area);
                            router.push(`/leads?${params.toString()}`);
                          }}
                          className="h-8 px-4 rounded-[8px] border border-[#BBF7D0] text-[11px] font-semibold text-[#15803D] hover:bg-[#15803D]/5 transition-colors"
                        >
                          View All Results
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Leads by Location Summary ──────────────────────────────── */}
              {sessionIdRef.current && <LeadLocationSummary sessionId={sessionIdRef.current} />}
            </div>

          </div>
        ) : (
          /* ── Default: Quick Search + Info Cards ───────────────────────── */
          <div className="grid grid-cols-1 gap-6">
            {/* Info cards */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-[#E8E5DF] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-[8px] bg-[#EEF2FF] flex items-center justify-center">
                        <Globe className="h-4 w-4 text-[#1D4ED8]" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-[13px] font-semibold text-[#18181B] mb-1">Multi-Source Search</h3>
                    <p className="text-[12px] text-[#8E8C86] leading-relaxed">
                      Search across Google Maps, Justdial, IndiaMart, and Clutch simultaneously
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-[#E8E5DF] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-[8px] bg-[#F0FBF4] flex items-center justify-center">
                        <Database className="h-4 w-4 text-[#15803D]" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-[13px] font-semibold text-[#18181B] mb-1">Real Leads</h3>
                    <p className="text-[12px] text-[#8E8C86] leading-relaxed">
                      All leads are verified and deduplicated before being saved to your CRM
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-[#E8E5DF] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-[8px] bg-[#FFFBEB] flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-[#D97706]" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-[13px] font-semibold text-[#18181B] mb-1">Live Tracking</h3>
                    <p className="text-[12px] text-[#8E8C86] leading-relaxed">
                      Watch scraping progress in real-time with detailed per-source metrics
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}
