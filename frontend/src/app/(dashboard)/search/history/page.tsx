"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Loader2,
  Clock,
  MapPin,
  Tag,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { leadService } from "@/services/lead.service";
import { apiClient } from "@utils/api-client";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className || ''}`} />;
}

interface SearchHistoryRecord {
  srNo: number;
  state: string;
  city: string;
  area: string;
  keyword: string;
  totalLeads: number;
  latestSearchDate: string;
  firstSearchDate: string;
}

const ROWS_OPTIONS = [10, 25, 50, 100];

const formatLocation = (state: string, city: string, area: string): string => {
  const parts = [];
  if (state && state !== "Unknown") parts.push(state);
  if (city && city !== "Unknown") parts.push(city);
  if (area && area !== "Unknown") parts.push(area);
  return parts.join(" → ") || "Not specified";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const convertToIST = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

export default function SearchHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<SearchHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async (
    pageNum: number,
    limitNum: number,
    searchTerm?: string,
    state?: string,
    keyword?: string,
    date?: string
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", limitNum.toString());
      if (searchTerm) params.append("search", searchTerm);
      if (state) params.append("state", state);
      if (keyword) params.append("keyword", keyword);
      if (date) params.append("date", date);

      const response = await apiClient.get<{
        success: boolean;
        data: SearchHistoryRecord[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/search/history?${params.toString()}`);

      if (response.success) {
        setData(response.data);
        setPage(response.pagination.page);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching search history:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, limit, search, filterState, filterKeyword, filterDate);
    setPage(1);
  }, [limit, search, filterState, filterKeyword, filterDate]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    if (field === "state") setFilterState(value);
    if (field === "keyword") setFilterKeyword(value);
    if (field === "date") setFilterDate(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterState("");
    setFilterKeyword("");
    setFilterDate("");
    if (searchInputRef.current) searchInputRef.current.value = "";
    if (stateInputRef.current) stateInputRef.current.value = "";
    if (keywordInputRef.current) keywordInputRef.current.value = "";
    if (dateInputRef.current) dateInputRef.current.value = "";
    setPage(1);
  };

  const handleRowClick = (record: SearchHistoryRecord) => {
    const params = new URLSearchParams();
    params.append("state", record.state);
    params.append("city", record.city);
    params.append("area", record.area);
    params.append("keyword", record.keyword);

    router.push(`/leads?${params.toString()}`);
  };

  const handleExport = () => {
    const headers = ["Sr.No", "Location", "Total Leads", "Searched Keyword", "Search Date & Time"];
    const rows = data.map((item) => [
      item.srNo,
      formatLocation(item.state, item.city, item.area),
      item.totalLeads,
      item.keyword,
      formatDate(item.latestSearchDate),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `search-history-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFiltered = search || filterState || filterKeyword || filterDate;

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 lg:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                boxShadow: "0 2px 10px rgba(29,78,216,0.25)",
              }}
            >
              <Clock className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.02em] leading-tight">
                Search History
              </h1>
              <p className="text-[13px] text-[#8E8C86]">
                View and manage your previous searches
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0AEA8]"
                strokeWidth={1.8}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by keyword, location, city..."
                className="w-full h-10 rounded-[10px] border border-[#E4E1DB] bg-white pl-9 pr-3
                           text-[13px] text-[#18181B] placeholder:text-[#B0AEA8]
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]
                           transition-all duration-150"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 rounded-[10px] border border-[#E4E1DB] bg-white
                         flex items-center gap-2 text-[13px] font-medium text-[#52525B]
                         hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150"
            >
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Filters {isFiltered && <span className="text-[#1D4ED8]">●</span>}
            </button>

            <button
              onClick={handleExport}
              disabled={data.length === 0}
              className="h-10 px-4 rounded-[10px] border border-[#E4E1DB] bg-white
                         flex items-center gap-2 text-[13px] font-medium text-[#52525B]
                         hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" strokeWidth={1.8} />
              Export CSV
            </button>
          </div>

          {showFilters && (
            <Card className="border-[#E8E5DF] shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86] mb-1.5">
                      State
                    </label>
                    <input
                      ref={stateInputRef}
                      type="text"
                      placeholder="Filter by state..."
                      className="w-full h-9 rounded-[8px] border border-[#E4E1DB] bg-white px-3
                                 text-[12px] text-[#18181B] placeholder:text-[#B0AEA8]
                                 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]
                                 transition-all duration-150"
                      onChange={(e) => handleFilterChange("state", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86] mb-1.5">
                      Keyword
                    </label>
                    <input
                      ref={keywordInputRef}
                      type="text"
                      placeholder="Filter by keyword..."
                      className="w-full h-9 rounded-[8px] border border-[#E4E1DB] bg-white px-3
                                 text-[12px] text-[#18181B] placeholder:text-[#B0AEA8]
                                 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]
                                 transition-all duration-150"
                      onChange={(e) => handleFilterChange("keyword", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86] mb-1.5">
                      Date
                    </label>
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="w-full h-9 rounded-[8px] border border-[#E4E1DB] bg-white px-3
                                 text-[12px] text-[#18181B]
                                 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]
                                 transition-all duration-150"
                      onChange={(e) => handleFilterChange("date", e.target.value)}
                    />
                  </div>

                  <div className="flex items-flex-end">
                    <button
                      onClick={clearFilters}
                      className="h-9 px-4 rounded-[8px] border border-[#E4E1DB] bg-white
                                 flex items-center gap-2 text-[12px] font-medium text-[#52525B]
                                 hover:bg-[#F5F3EF] transition-all duration-150 w-full"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      Clear Filters
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {total === 0 && !isLoading ? (
          <Card className="border-[#E8E5DF] shadow-sm mt-6">
            <CardContent className="p-12 text-center">
              <div
                className="h-16 w-16 rounded-[12px] flex items-center justify-center mx-auto mb-3"
                style={{ background: "#F0FBF4" }}
              >
                <Clock className="h-8 w-8 text-[#15803D]" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-semibold text-[#18181B] mb-1">
                No Search History Found
              </p>
              <p className="text-[12px] text-[#8E8C86]">
                Start searching for leads to see your history here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#E8E5DF] shadow-sm mt-6">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E5DF] bg-[#FAFAF8]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86] w-12">
                      Sr.No
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86]">
                      Location
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86]">
                      Total Leads
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86]">
                      Searched Keyword
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8E8C86]">
                      Search Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: limit }).map((_, idx) => (
                      <tr key={idx} className="border-b border-[#E8E5DF] hover:bg-[#F9F8F6] transition-colors">
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-6" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-40" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    data.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleRowClick(item)}
                        className="border-b border-[#E8E5DF] hover:bg-[#F9F8F6] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 text-[12px] font-medium text-[#52525B]">
                          {item.srNo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-[#B0AEA8] flex-shrink-0" strokeWidth={2} />
                            <span className="text-[12px] text-[#52525B] group-hover:text-[#1D4ED8] transition-colors">
                              {formatLocation(item.state, item.city, item.area)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className="bg-[#EEF2FF] text-[#1D4ED8] text-[11px] font-semibold"
                          >
                            {item.totalLeads}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-[#B0AEA8] flex-shrink-0" strokeWidth={2} />
                            <span className="text-[12px] text-[#52525B]">{item.keyword}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-[#B0AEA8] flex-shrink-0" strokeWidth={2} />
                            <span className="text-[12px] text-[#52525B]">{formatDate(item.latestSearchDate)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>

            {data.length > 0 && (
              <div className="border-t border-[#E8E5DF] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-[12px] text-[#8E8C86]">
                  <span>Rows per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    className="h-8 px-2 rounded-[6px] border border-[#E4E1DB] bg-white
                               text-[12px] text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  >
                    {ROWS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-[12px] text-[#52525B]">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} searches
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 rounded-[6px] border border-[#E4E1DB] bg-white
                               flex items-center justify-center text-[#52525B]
                               hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      let pageNum = idx + 1;
                      if (totalPages > 5 && page > 3) {
                        pageNum = page - 2 + idx;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-8 w-8 rounded-[6px] text-[12px] font-medium transition-all duration-150 ${
                            pageNum === page
                              ? "bg-[#1D4ED8] text-white"
                              : "border border-[#E4E1DB] bg-white text-[#52525B] hover:bg-[#F5F3EF]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 rounded-[6px] border border-[#E4E1DB] bg-white
                               flex items-center justify-center text-[#52525B]
                               hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
