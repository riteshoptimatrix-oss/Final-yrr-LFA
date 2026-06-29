"use client";

import { useEffect, useState, useRef } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Database,
  TrendingUp,
  XCircle,
  Square,
  Play,
} from "lucide-react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { isSearchActive, isSearchTerminal, getStateLabel, getStateColor, SearchState, parseSearchState } from "@/lib/search-state-machine";
import type { SearchStatusData } from "@/services/search-status.service";

function AnimatedMetricCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  const animated = useAnimatedNumber(value, 250);

  return (
    <div
      className="relative overflow-hidden rounded-[10px] border p-3 transition-all duration-200"
      style={{ borderColor: color + "30", background: bg }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.06em]"
          style={{ color }}
        >
          {label}
        </span>
        <div
          className="h-6 w-6 rounded-[6px] flex items-center justify-center"
          style={{ background: color + "15" }}
        >
          <Icon className="h-3 w-3" style={{ color }} strokeWidth={2.5} />
        </div>
      </div>
      <p
        className="text-[22px] font-bold tracking-[-0.02em] tabular-nums transition-colors"
        style={{ color: "#18181B" }}
      >
        {animated.toLocaleString()}
      </p>
    </div>
  );
}

function ElapsedTimer({
  startedAt,
  isRunning,
  completedAt,
}: {
  startedAt: string;
  isRunning: boolean;
  completedAt?: string;
}) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : isRunning ? null : start;
    const tick = () => {
      const now = end || Date.now();
      const diff = Math.max(0, now - start);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      );
    };
    tick();
    if (isRunning) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [startedAt, isRunning, completedAt]);

  if (!elapsed) return null;
  return (
    <span className="text-[12px] font-mono text-[#52525B] font-medium">
      {elapsed}
    </span>
  );
}

function StateBadge({ state }: { state: SearchState }) {
  const color = getStateColor(state);
  const label = getStateLabel(state);

  if (isSearchActive(state)) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium animate-pulse"
        style={{
          background: color + "15",
          color,
          border: `1px solid ${color}40`,
        }}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium"
      style={{
        background: color + "15",
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {state === SearchState.COMPLETED && <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />}
      {state === SearchState.FAILED && <XCircle className="h-3 w-3" strokeWidth={2.5} />}
      {state === SearchState.STOPPED && <Square className="h-3 w-3 fill-current" strokeWidth={2.5} />}
      {label}
    </span>
  );
}

export interface SearchProgressBannerProps {
  progress: SearchStatusData | null;
  connectionStatus?: "connected" | "disconnected" | "reconnecting";
  onStop?: () => void;
  onResume?: () => void;
}

export function SearchProgressBanner({
  progress,
  connectionStatus,
  onStop,
  onResume,
}: SearchProgressBannerProps) {
  const [showLiveLeads, setShowLiveLeads] = useState(true);
  const liveLeadsEndRef = useRef<HTMLDivElement>(null);

  if (!progress) return null;

  const searchState = parseSearchState(progress.searchState);
  const isRunning = isSearchActive(searchState);
  const isTerminal = isSearchTerminal(searchState);
  const isCompleted = searchState === SearchState.COMPLETED;
  const isFailed =
    searchState === SearchState.FAILED ||
    searchState === SearchState.TIMEOUT ||
    searchState === SearchState.GOOGLE_BLOCKED;
  const isStopped = searchState === SearchState.STOPPED;
  const hasBreakdown = Object.keys(progress.sourceBreakdown).length > 0;
  const hasLiveLeads = progress.liveLeads.length > 0;
  const showSearchingToast = isRunning && searchState !== SearchState.IDLE;

  const startedTime = new Date(progress.startedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    if (hasLiveLeads && liveLeadsEndRef.current) {
      liveLeadsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [progress.liveLeads.length, hasLiveLeads]);

  return (
    <div className="mb-6 rounded-[14px] border bg-white shadow-sm transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-[12px] flex items-center justify-center shrink-0 transition-colors duration-300"
            style={{
              background: isCompleted
                ? "linear-gradient(135deg, #F0FBF4 0%, #DCFCE7 100%)"
                : isFailed
                  ? "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)"
                  : "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
            }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-[#15803D]" strokeWidth={2} />
            ) : isFailed ? (
              <XCircle className="h-6 w-6 text-[#DC2626]" strokeWidth={2} />
            ) : (
              <Search className="h-6 w-6 text-[#1D4ED8]" strokeWidth={2} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-[14px] font-semibold text-[#18181B]">
                  {isCompleted
                    ? "Search Completed"
                    : isFailed
                      ? "Search Failed"
                      : isStopped
                        ? "Search Stopped"
                        : "Search In Progress"}
                </h3>
                <ElapsedTimer
                  startedAt={progress.startedAt}
                  isRunning={isRunning}
                  completedAt={progress.completedAt}
                />
              </div>
              <div className="flex items-center gap-2">
                {!isRunning && (
                  <span className="text-[11px] text-[#8E8C86]">
                    {startedTime}
                  </span>
                )}
                <StateBadge state={searchState} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="text-[13px]">
                  <span className="text-[#8E8C86] font-medium">Keyword: </span>
                  <span className="text-[#18181B] font-semibold">
                    {progress.keyword}
                  </span>
                </div>
                <div className="text-[13px]">
                  <span className="text-[#8E8C86] font-medium">Location: </span>
                  <span className="text-[#18181B] font-semibold">
                    {progress.state &&
                      progress.city &&
                      `${progress.state} → ${progress.city}${progress.area ? ` → ${progress.area}` : ""}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[13px] text-[#18181B]">
                <span className="text-[#8E8C86] font-medium">Status: </span>
                <span className="text-[#18181B]">
                  {isCompleted
                    ? "Search completed successfully"
                    : isFailed
                      ? progress.error || "Search encountered an error"
                      : isStopped
                        ? "Search was stopped by user"
                        : getStateLabel(searchState)}
                </span>
              </div>

              {isRunning && progress.currentLead && (
                <div className="text-[13px]">
                  <span className="text-[#8E8C86] font-medium">Current: </span>
                  <span className="text-[#18181B] font-medium">{progress.currentLead}</span>
                </div>
              )}

              {isRunning && progress.eta && progress.eta > 0 && (
                <div className="text-[13px]">
                  <span className="text-[#8E8C86] font-medium">ETA: </span>
                  <span className="text-[#18181B]">
                    {progress.eta < 60
                      ? `${progress.eta}s remaining`
                      : `${Math.ceil(progress.eta / 60)}m remaining`}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <AnimatedMetricCard
                label="Found"
                value={progress.foundCount}
                icon={TrendingUp}
                color="#1D4ED8"
                bg="#EEF2FF"
              />
              <AnimatedMetricCard
                label="Saved"
                value={progress.savedCount}
                icon={Database}
                color="#15803D"
                bg="#F0FBF4"
              />
              <AnimatedMetricCard
                label="Duplicates"
                value={progress.duplicateCount}
                icon={Copy}
                color="#D97706"
                bg="#FFFBEB"
              />
              <AnimatedMetricCard
                label="Rejected"
                value={progress.failedCount}
                icon={XCircle}
                color="#DC2626"
                bg="#FEF2F2"
              />
            </div>

            {connectionStatus === "reconnecting" && isRunning && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
                <Loader2 className="h-3.5 w-3.5 text-[#D97706] animate-spin shrink-0" />
                <span className="text-[12px] text-[#92400E]">
                  Socket reconnecting… progress will resume automatically
                </span>
              </div>
            )}

            {connectionStatus === "disconnected" && isRunning && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
                <Loader2 className="h-3.5 w-3.5 text-[#D97706] animate-spin shrink-0" />
                <span className="text-[12px] text-[#92400E]">
                  Reconnecting to live updates…
                </span>
              </div>
            )}

            {hasBreakdown && (
              <div className="mt-4">
                <h4 className="text-[12px] font-semibold text-[#52525B] uppercase tracking-wide mb-2">
                  Lead Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(progress.sourceBreakdown).map(
                    ([source, count]) => (
                      <div
                        key={source}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-[8px] text-[12px]"
                        style={{
                          background: "#FAFAF8",
                          border: "1px solid #E4E1DB",
                        }}
                      >
                        <span className="font-medium text-[#52525B] capitalize">
                          {source.replace(/-/g, ' ')}
                        </span>
                        <span className="font-bold text-[14px] tabular-nums text-[#18181B]">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {isRunning && hasLiveLeads && showLiveLeads && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowLiveLeads(false)}
                  className="text-[12px] font-semibold text-[#52525B] uppercase tracking-wide mb-2 flex items-center gap-2"
                >
                  <span>Discovered Businesses</span>
                  <span className="text-[10px] font-normal text-[#8E8C86] normal-case">
                    ({progress.liveLeads.length})
                  </span>
                </button>
                <div className="max-h-[100px] overflow-y-auto space-y-1 scrollbar-thin">
                  {progress.liveLeads.map((name, i) => (
                    <div
                      key={`${name}-${i}`}
                      className="flex items-center gap-2 text-[12px] text-[#52525B]"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                  <div ref={liveLeadsEndRef} />
                </div>
              </div>
            )}

            {isRunning && progress.logs && progress.logs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[12px] font-semibold text-[#52525B] uppercase tracking-wide mb-2">
                  Live Logs
                </h4>
                <div className="max-h-32 overflow-y-auto rounded-[8px] border border-[#E8E5DF] bg-[#FAFAF9] p-3 space-y-1">
                  {progress.logs.slice(-20).map((log, i) => (
                    <div key={`${log.timestamp}-${i}`} className="text-[11px] font-mono leading-relaxed">
                      <span className="text-[#8E8C86]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span
                        className={
                          log.level === "error"
                            ? "text-[#DC2626]"
                            : log.level === "warn"
                              ? "text-[#D97706]"
                              : "text-[#52525B]"
                        }
                      >
                        {" "}{log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isRunning && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-[400px] bg-[#E8E5DF] rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        background: "linear-gradient(90deg, #3B60E4 0%, #1D4ED8 100%)",
                        width: `${Math.min(progress?.progress || 0, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#1D4ED8] min-w-[50px] text-right tabular-nums">
                    {Math.min(progress?.progress || 0, 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-[#EEF2FF] text-[12px]">
                  <Loader2 className="h-3.5 w-3.5 text-[#1D4ED8] animate-spin shrink-0" />
                  <span className="text-[#1D4ED8]">
                    Found: {progress?.foundCount || 0} &middot; Saved:{" "}
                    {progress?.savedCount || 0} &middot; Duplicates:{" "}
                    {progress?.duplicateCount || 0}
                  </span>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#F0FBF4]">
                    <span className="text-[#15803D] font-semibold">
                      {progress.foundCount} leads found
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#15803D]">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>
                      {progress.savedCount} saved &middot;{" "}
                      {progress.duplicateCount} duplicates removed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isFailed && (
              <div className="mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA]">
                <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
                <span className="text-[12.5px] text-[#DC2626]">
                  {progress.error || "Search failed. Please try again."}
                </span>
              </div>
            )}

            {isStopped && (
              <div className="mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
                <AlertCircle className="h-4 w-4 text-[#D97706] shrink-0" />
                <span className="text-[12.5px] text-[#92400E]">
                  Search stopped. {progress.savedCount} leads saved so far.
                </span>
              </div>
            )}

            {isCompleted && (
              <div className="mt-4 rounded-[10px] bg-[#F0FBF4] border border-[#BBF7D0] p-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className="h-5 w-5 text-[#15803D] shrink-0"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-[#15803D]">
                      Search Completed Successfully
                    </p>
                    <p className="text-[11.5px] text-[#15803D]/70 mt-0.5">
                      {progress.savedCount} leads saved &middot;{" "}
                      {progress.keyword} &middot;{" "}
                      {[progress.state, progress.city, progress.area]
                        .filter(Boolean)
                        .join(" → ") || "All locations"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {onStop && isRunning && (
          <div className="mt-4 pt-4 border-t border-[#E8E5DF] flex justify-end">
            <button
              type="button"
              onClick={onStop}
              className="h-9 px-4 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors flex items-center gap-2"
            >
              <Square className="h-3.5 w-3.5 fill-current" strokeWidth={2} />
              Stop Search
            </button>
          </div>
        )}

        {onResume && isStopped && (
          <div className="mt-4 pt-4 border-t border-[#E8E5DF] flex justify-end">
            <button
              type="button"
              onClick={onResume}
              className="h-9 px-4 rounded-[8px] border border-[#BBF7D0] bg-[#F0FBF4] text-[12px] font-semibold text-[#15803D] hover:bg-[#DCFCE7] transition-colors flex items-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2} />
              Resume Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
