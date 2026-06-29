"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Database,
  MapPin,
  Search,
  TrendingUp,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";

export interface SearchCompletedSummary {
  sessionId: string;
  keyword: string;
  location: string;
  state?: string;
  city?: string;
  area?: string;
  totalLeads: number;
  uniqueLeads: number;
  duplicatesRemoved: number;
  failedCount: number;
  durationMs: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function buildLocationLabel(summary: SearchCompletedSummary): string {
  const parts = [summary.area, summary.city, summary.state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return summary.location || "Selected location";
}

interface SearchCompletedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SearchCompletedSummary | null;
}

export function SearchCompletedDialog({
  open,
  onOpenChange,
  summary,
}: SearchCompletedDialogProps) {
  const router = useRouter();

  const handleViewLeads = useCallback(() => {
    if (!summary) return;
    onOpenChange(false);
    const params = new URLSearchParams();
    params.set("sessionId", summary.sessionId);
    if (summary.keyword) params.set("keyword", summary.keyword);
    router.push(`/leads?${params.toString()}`);
  }, [summary, onOpenChange, router]);

  const handleNewSearch = useCallback(() => {
    onOpenChange(false);
    router.push("/search");
  }, [onOpenChange, router]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open || !summary) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleViewLeads();
      }
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, summary, handleViewLeads, handleClose]);

  if (!summary) return null;

  const locationLabel = buildLocationLabel(summary);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-[#F0FBF4] to-white px-6 pt-6 pb-4 border-b border-[#BBF7D0]/60">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#15803D]/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-[#15803D]" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <DialogTitle className="text-[17px] font-semibold text-[#18181B]">
                  Search Completed
                </DialogTitle>
                <p className="text-[13px] text-[#52525B] mt-0.5">{summary.keyword}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-[#8E8C86] hover:bg-[#E8E5DF] transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </DialogHeader>

          <div className="mt-4 flex items-start gap-2 text-[12.5px] text-[#52525B]">
            <MapPin className="h-4 w-4 text-[#8E8C86] shrink-0 mt-0.5" strokeWidth={2} />
            <span>{locationLabel}</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86] mb-3">
              Summary
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[#C7D2FE]/60 bg-[#EEF2FF]/50 px-3 py-2.5">
                <TrendingUp className="h-4 w-4 text-[#1D4ED8]" strokeWidth={2} />
                <div>
                  <p className="text-[10px] text-[#8E8C86] font-medium">Businesses Found</p>
                  <p className="text-[15px] font-bold text-[#18181B] tabular-nums">{summary.totalLeads}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[#BBF7D0]/60 bg-[#F0FBF4]/50 px-3 py-2.5">
                <Database className="h-4 w-4 text-[#15803D]" strokeWidth={2} />
                <div>
                  <p className="text-[10px] text-[#8E8C86] font-medium">Saved</p>
                  <p className="text-[15px] font-bold text-[#18181B] tabular-nums">{summary.uniqueLeads}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[#FDE68A]/60 bg-[#FFFBEB]/50 px-3 py-2.5">
                <Copy className="h-4 w-4 text-[#D97706]" strokeWidth={2} />
                <div>
                  <p className="text-[10px] text-[#8E8C86] font-medium">Duplicates</p>
                  <p className="text-[15px] font-bold text-[#18181B] tabular-nums">{summary.duplicatesRemoved}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/50 px-3 py-2.5">
                <XCircle className="h-4 w-4 text-[#DC2626]" strokeWidth={2} />
                <div>
                  <p className="text-[10px] text-[#8E8C86] font-medium">Rejected</p>
                  <p className="text-[15px] font-bold text-[#18181B] tabular-nums">{summary.failedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-[10px] bg-[#F5F3EF] px-3 py-2.5">
            <Clock className="h-4 w-4 text-[#8E8C86]" strokeWidth={2} />
            <div>
              <p className="text-[10px] text-[#8E8C86] font-medium">Duration</p>
              <p className="text-[13px] font-semibold text-[#18181B]">{formatDuration(summary.durationMs)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-[8px] border-[#E4E1DB] text-[13px] font-semibold"
            onClick={handleNewSearch}
          >
            <Search className="h-4 w-4 mr-2" strokeWidth={2} />
            New Search
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-[8px] border-[#E4E1DB] text-[13px] font-semibold"
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-2" strokeWidth={2} />
            Close
          </Button>
          <Button
            className="flex-1 h-10 rounded-[8px] bg-[#15803D] hover:bg-[#166534] text-[13px] font-semibold"
            onClick={handleViewLeads}
          >
            View Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
