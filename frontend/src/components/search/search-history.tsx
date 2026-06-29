"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { leadService } from "@/services/lead.service";
import { useSearchSocket } from "@/hooks/useSearchSocket";
import {
  Search,
  Loader2,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ArrowRight,
  AlertCircle,
  Pause,
  Zap,
} from "lucide-react";

function getSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

type SearchStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "STOPPED" | "CANCELLED" | "TIMEOUT" | "PARTIAL_SUCCESS" | "NO_RESULTS";

interface SearchHistoryItem {
  _id: string;
  searchSessionId: string;
  keyword: string;
  state?: string;
  city?: string;
  area?: string;
  sources: string[];
  totalLeads: number;
  businessesFound?: number;
  businessesSaved?: number;
  duplicates?: number;
  status: SearchStatus;
  startedAt: string;
  completedAt?: string;
  stoppedAt?: string;
  duration: number;
  failureReason?: string;
  failureClassification?: string;
  errorMetadata?: {
    errorMessage?: string;
    browserError?: string;
    googleMapsError?: string;
  };
}

interface AggregatedResponse {
  items: SearchHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_COLORS: Record<SearchStatus, { bg: string; text: string; icon: string }> = {
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-700', icon: '✗' },
  STOPPED: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⊘' },
  CANCELLED: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '✕' },
  TIMEOUT: { bg: 'bg-red-100', text: 'text-red-700', icon: '⏱' },
  PARTIAL_SUCCESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠' },
  NO_RESULTS: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '○' },
  QUEUED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⧗' },
  RUNNING: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '↻' },
};

function SkeletonRow() {
  return (
    <tr className="border-b border-[#F0EFEB] last:border-b-0">
      <td className="px-4 py-3">
        <div className="h-3 w-6 bg-[#E8E5DF] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-48 bg-[#E8E5DF] rounded animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-12 bg-[#E8E5DF] rounded animate-pulse ml-auto" />
      </td>
      <td className="px-4 py-3">
        <div className="h-3 w-28 bg-[#E8E5DF] rounded animate-pulse ml-auto" />
      </td>
    </tr>
  );
}

function getStatusIcon(status: SearchStatus) {
  switch (status) {
    case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />;
    case 'FAILED': case 'TIMEOUT': return <XCircle className="h-4 w-4 text-red-600" strokeWidth={2} />;
    case 'STOPPED': case 'CANCELLED': return <Pause className="h-4 w-4 text-yellow-600" strokeWidth={2} />;
    case 'RUNNING': case 'QUEUED': return <Zap className="h-4 w-4 text-blue-600 animate-pulse" strokeWidth={2} />;
    case 'NO_RESULTS': return <AlertCircle className="h-4 w-4 text-gray-600" strokeWidth={2} />;
    case 'PARTIAL_SUCCESS': return <AlertCircle className="h-4 w-4 text-yellow-600" strokeWidth={2} />;
    default: return <Clock className="h-4 w-4 text-gray-600" strokeWidth={2} />;
  }
}

export function SearchHistory({ sessionId: activeSessionId }: { sessionId?: string | null | undefined }) {
  const router = useRouter();
  const [data, setData] = useState<AggregatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SearchStatus | 'ALL'>('ALL');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async (pageNum: number) => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      
      const res = await leadService.getSearchHistory(pageNum, 20);
      if (res?.success && res?.data) {
        const d = res.data as AggregatedResponse;
        setData((prev) => {
          if (pageNum === 1) return d;
          if (!prev) return d;
          return {
            items: [...prev.items, ...d.items],
            pagination: d.pagination,
          };
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
    setData(null);
    setLoading(true);
    fetchHistory(1);
  }, [statusFilter, fetchHistory]);

  useSearchSocket(activeSessionId ?? null, {
    onCompleted() {
      setTimeout(() => fetchHistory(1), 500);
    },
    onError() {
      setTimeout(() => fetchHistory(1), 500);
    },
    onStopped() {
      setTimeout(() => fetchHistory(1), 500);
    },
    onTimeout() {
      setTimeout(() => fetchHistory(1), 500);
    },
    onHistoryUpdate() {
      setTimeout(() => fetchHistory(1), 500);
    },
  });

  useEffect(() => {
    const socket: Socket = io(`${getSocketUrl()}/automation-monitor`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("search:history-update", () => {
      setTimeout(() => fetchHistory(1), 300);
    });
    
    socket.on("search:completed", () => {
      setTimeout(() => fetchHistory(1), 300);
    });
    
    socket.on("search:error", () => {
      setTimeout(() => fetchHistory(1), 300);
    });
    
    socket.on("search:stopped", () => {
      setTimeout(() => fetchHistory(1), 300);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchHistory]);

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchHistory(1);
    }, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    setDeleting(true);
    try {
      await leadService.clearSearchHistory();
      setData(null);
      setPage(1);
    } catch {
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleRowClick = (item: SearchHistoryItem) => {
    const params = new URLSearchParams();
    params.set("searchSessionId", item.searchSessionId);
    if (item.keyword) params.set("keyword", item.keyword);
    if (item.state) params.set("state", item.state);
    if (item.city) params.set("city", item.city);
    if (item.area) params.set("area", item.area);
    router.push(`/leads?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getLocationString = (item: SearchHistoryItem) => {
    const parts = [item.state, item.city, item.area].filter(Boolean);
    return parts.join(" → ") || "—";
  };

  const items = data?.items || [];
  const pagination = data?.pagination;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  return (
    <Card className="border-[#E8E5DF] shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
          <CardTitle className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">
            Search History Audit
          </CardTitle>
          {total > 0 && (
            <span className="text-[10px] text-[#B0AEA8] font-medium ml-1">
              ({total})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SearchStatus | 'ALL')}
            className="text-[10px] px-2 py-1 border border-[#E8E5DF] rounded bg-white text-[#52525B]"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="QUEUED">Queued</option>
            <option value="FAILED">Failed</option>
            <option value="STOPPED">Stopped</option>
            <option value="TIMEOUT">Timeout</option>
            <option value="NO_RESULTS">No Results</option>
            <option value="PARTIAL_SUCCESS">Partial Success</option>
          </select>
          
          {total > 0 && !showConfirmDelete && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex items-center gap-1 text-[10px] text-[#B0AEA8] hover:text-[#DC2626] transition-colors"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            </button>
          )}
          {showConfirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#DC2626] font-medium">Clear?</span>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={deleting}
                className="text-[10px] font-semibold text-[#DC2626] hover:text-[#B91C1C] disabled:opacity-50"
              >
                {deleting ? "..." : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="text-[10px] font-medium text-[#B0AEA8] hover:text-[#52525B]"
              >
                No
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && data === null ? (
          <div className="px-4 pb-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E5DF]">
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] w-[52px]">Sr.</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">Keyword</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">Status</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[60px]">Leads</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[70px]">Duration</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-[#D4D1CB] mb-2" strokeWidth={1.5} />
            <p className="text-[12px] text-[#B0AEA8] font-medium">
              No Search History
            </p>
            <p className="text-[11px] text-[#C4C2BC] mt-0.5">
              All search attempts will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E5DF] bg-[#FAFAF8]">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] w-[52px]">Sr.</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">Keyword</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[60px]">Leads</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[70px]">Duration</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const dateStr = item.completedAt || item.startedAt;
                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-[#F0EFEB] last:border-b-0 hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[12px] text-[#8E8C86] font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-[#18181B] truncate">
                            {item.keyword}
                          </span>
                        </div>
                        {item.state && (
                          <div className="flex items-center gap-1 text-[10px] text-[#8E8C86] mt-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{getLocationString(item)}</span>
                          </div>
                        )}
                        {item.failureReason && (
                          <div className="text-[10px] text-red-600 mt-0.5 truncate">
                            {item.failureReason.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(item.status)}
                          <span className="text-[10px] font-semibold text-[#52525B]">
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-[22px] rounded-[6px] bg-[#EEF2FF] text-[11px] font-semibold text-[#1D4ED8]">
                          {item.totalLeads || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] text-[#52525B] font-medium whitespace-nowrap">
                          {formatDuration(item.duration || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-[10px] text-[#52525B] font-medium whitespace-nowrap">
                          {formatDate(dateStr)}
                        </div>
                        <div className="text-[10px] text-[#B0AEA8] whitespace-nowrap">
                          {formatTime(dateStr)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {page < totalPages && (
              <div className="px-4 py-2 border-t border-[#E8E5DF]">
                <button
                  type="button"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchHistory(next);
                  }}
                  className="w-full py-2 text-[11px] font-medium text-[#1D4ED8] hover:text-[#1E40AF] transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowRight className="h-3 w-3 rotate-90" strokeWidth={2} />
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchHistory]);

  const handleClearHistory = async () => {
    setDeleting(true);
    try {
      await leadService.clearSearchHistory();
      setData(null);
      setPage(1);
    } catch {
    } finally {
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const handleRowClick = (item: SearchHistoryItem) => {
    const params = new URLSearchParams();
    params.set("searchSessionId", item.searchSessionId);
    if (item.keyword) params.set("keyword", item.keyword);
    if (item.state) params.set("state", item.state);
    if (item.city) params.set("city", item.city);
    if (item.area) params.set("area", item.area);
    router.push(`/leads?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const getLocationString = (item: SearchHistoryItem) => {
    const parts = [item.state, item.city, item.area].filter(Boolean);
    return parts.join(" → ") || "—";
  };

  const items = data?.items || [];
  const pagination = data?.pagination;
  const total = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 0;

  return (
    <Card className="border-[#E8E5DF] shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#B0AEA8]" strokeWidth={1.8} />
          <CardTitle className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">
            Search History
          </CardTitle>
          {total > 0 && (
            <span className="text-[10px] text-[#B0AEA8] font-medium ml-1">
              ({total})
            </span>
          )}
        </div>
        {total > 0 && !showConfirmDelete && (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="flex items-center gap-1 text-[10px] text-[#B0AEA8] hover:text-[#DC2626] transition-colors"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            Clear
          </button>
        )}
        {showConfirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#DC2626] font-medium">Clear all?</span>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={deleting}
              className="text-[10px] font-semibold text-[#DC2626] hover:text-[#B91C1C] disabled:opacity-50"
            >
              {deleting ? "Clearing..." : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="text-[10px] font-medium text-[#B0AEA8] hover:text-[#52525B]"
            >
              No
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="px-4 pb-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E5DF]">
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] w-[52px]">Sr.</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">Location</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[80px]">Leads</th>
                  <th className="pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[130px]">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-8 w-8 text-[#D4D1CB] mb-2" strokeWidth={1.5} />
            <p className="text-[12px] text-[#B0AEA8] font-medium">
              No Search History Available
            </p>
            <p className="text-[11px] text-[#C4C2BC] mt-0.5">
              Your completed searches will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E5DF]">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] w-[52px]">
                    Sr.
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8]">
                    <MapPin className="h-3 w-3 inline mr-1" strokeWidth={1.5} />
                    Location
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[80px]">
                    Leads
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0AEA8] text-right w-[130px]">
                    Date &amp; Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const isFailed = item.status === "failed";
                  const dateStr = item.completedAt || item.startedAt;
                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-[#F0EFEB] last:border-b-0 hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[12px] text-[#8E8C86] font-medium align-top pt-3.5">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[13px] font-medium text-[#18181B]">
                            {item.keyword}
                          </span>
                          {isFailed ? (
                            <XCircle className="h-3 w-3 text-[#DC2626] shrink-0" strokeWidth={2} />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-[#15803D] shrink-0" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#8E8C86] mt-0.5">
                          <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{getLocationString(item)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right align-top pt-3.5">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] rounded-[6px] bg-[#EEF2FF] text-[11px] font-semibold text-[#1D4ED8]">
                          {item.totalLeads}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top pt-3.5">
                        <div className="text-[11px] text-[#52525B] font-medium whitespace-nowrap">
                          {formatDate(dateStr)}
                        </div>
                        <div className="text-[10px] text-[#B0AEA8] whitespace-nowrap">
                          {formatTime(dateStr)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {page < totalPages && (
              <div className="px-4 py-2 border-t border-[#E8E5DF]">
                <button
                  type="button"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchHistory(next);
                  }}
                  className="w-full py-2 text-[11px] font-medium text-[#1D4ED8] hover:text-[#1E40AF] transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowRight className="h-3 w-3 rotate-90" strokeWidth={2} />
                  Load More ({pagination!.total - items.length} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
