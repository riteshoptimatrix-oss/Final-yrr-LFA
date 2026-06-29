"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useOverviewAnalytics, useLeadAnalyticsData, useAutomationAnalyticsData, useAreaDensity, useTopAreas } from "@/hooks/useAnalytics";
import { TopAreasChart } from "@/components/analytics/TopAreasChart";

const AreaHeatmap = dynamic(
  () => import("@/components/analytics/AreaHeatmap").then((mod) => mod.AreaHeatmap),
  { ssr: false }
);

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Alert, AlertDescription } from "@components/ui/alert";
import {
  Users,
  Globe,
  ShieldCheck,
  AlertCircle,
  Mail,
  Zap,
  FileText,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Shield,
  Layout,
  Eye,
  ThumbsUp,
  AlertTriangle,
  Search,
  Target,
  SendHorizonal,
  Clock,
  MessageCircle,
} from "lucide-react";

const COLORS = ['#1D4ED8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<string>('last7days');

  const dateFilter = useMemo(() => {
    const now = new Date();
    let start: Date | undefined;

    switch (dateRange) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start = new Date();
        start.setDate(start.getDate() - 30);
        break;
      default:
        start = undefined;
    }

    return {
      startDate: start?.toISOString(),
      endDate: now.toISOString(),
    };
  }, [dateRange]);

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErrorData,
  } = useOverviewAnalytics(dateFilter);

  const { data: leadAnalytics } = useLeadAnalyticsData(dateFilter);
  const { data: automationAnalytics } = useAutomationAnalyticsData(dateFilter);
  const { data: areaDensityData, isLoading: areaDensityLoading, isError: areaDensityError } = useAreaDensity(dateFilter);
  const { data: topAreasData, isLoading: topAreasLoading, isError: topAreasError } = useTopAreas(dateFilter, 10);

  if (overviewLoading && !overview) {
    return (
      <div className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-[13px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)",
            }}
          >
            <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" />
          </div>
          <span className="text-[13.5px] font-medium text-[#52525B]">Loading analytics…</span>
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-[11px] p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13.5px] font-semibold text-red-900">Failed to load analytics</p>
              <p className="text-[12.5px] text-red-700 mt-1">
                {overviewErrorData instanceof Error ? overviewErrorData.message : "An unexpected error occurred"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const selectTriggerCls =
    "h-9 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] text-[13px] text-[#52525B] focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]";

  return (
    <div className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
              boxShadow: "0 1px 6px rgba(29,78,216,0.22)",
            }}
          >
            <Activity className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.025em] leading-tight">
              Analytics
            </h1>
            <p className="text-[12.5px] text-[#8E8C86] mt-0.5 leading-tight">
              Business insights and performance metrics — auto-refreshing every 15 seconds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-medium text-[#52525B]">Date Range:</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className={`w-44 ${selectTriggerCls}`}>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px] border border-[#E8E5DF] bg-[#FAFAF8] shadow-lg">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="flex space-x-0.5 border-b border-[#E8E5DF]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'overview'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'leads'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'automation'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Automation
          </button>
          <button
            onClick={() => setActiveTab('responsive')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'responsive'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Responsive
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'intelligence'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Intelligence
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'outreach'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Outreach
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-150 ${
              activeTab === 'pipeline'
                ? 'border-[#1D4ED8] text-[#1D4ED8]'
                : 'border-transparent text-[#B0AEA8] hover:text-[#52525B]'
            }`}
          >
            Pipeline
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Total Leads</span>
                <Users className="h-4 w-4 text-[#1D4ED8]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.totalLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Leads collected</p>
            </div>

            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">High Potential</span>
                <ShieldCheck className="h-4 w-4 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.highPotentialLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">High-potential leads</p>
            </div>

            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Emails Extracted</span>
                <Mail className="h-4 w-4 text-[#1D4ED8]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#1D4ED8]">{overview.emailsExtracted}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Contacts found</p>
            </div>

            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Automation Runs</span>
                <Zap className="h-4 w-4 text-purple-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-purple-600">{overview.automationRuns}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Total workflows executed</p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Scraping Success Rate</span>
                <Activity className="h-4 w-4 text-[#1D4ED8]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.scrapingSuccessRate}%</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Successful scrapes</p>
            </div>

            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Websites Without SSL</span>
                <AlertCircle className="h-4 w-4 text-orange-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-orange-600">{overview.websitesWithoutSsl}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Businesses with HTTP</p>
            </div>

            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex flex-row items-center justify-between space-y-0 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Exports Generated</span>
                <FileText className="h-4 w-4 text-[#1D4ED8]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.exportsGenerated}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Total exports</p>
            </div>
          </div>

          {/* Responsive & Intelligence Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg Responsive</span>
                <Smartphone className="h-4 w-4 text-blue-500" strokeWidth={1.8} />
              </div>
              <div className="text-xl font-bold text-[#18181B]">{overview.averageResponsiveScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Responsive score avg</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg Trust</span>
                <Shield className="h-4 w-4 text-emerald-500" strokeWidth={1.8} />
              </div>
              <div className="text-xl font-bold text-[#18181B]">{overview.averageTrustScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Trust score avg</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Mobile Issues</span>
                <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
              </div>
              <div className="text-xl font-bold text-red-600">{overview.mobileUnfriendlyWebsites}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Not mobile friendly</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Opportunities</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div className="text-xl font-bold text-emerald-600">{overview.highOpportunityLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">High-value leads</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leads Over Time */}
            <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="border-b border-[#E8E5DF] px-5 py-4">
                <h3 className="text-[14px] font-semibold text-[#18181B]">Leads Over Time</h3>
                <p className="text-[12px] text-[#B0AEA8] mt-1">Lead generation trends</p>
              </div>
              <div className="p-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[]}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DF" />
                    <XAxis dataKey="name" stroke="#B0AEA8" />
                    <YAxis stroke="#B0AEA8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAFAF8",
                        border: "1px solid #E8E5DF",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1D4ED8"
                      fillOpacity={1}
                      fill="url(#colorLeads)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Qualification Distribution */}
            <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="border-b border-[#E8E5DF] px-5 py-4">
                <h3 className="text-[14px] font-semibold text-[#18181B]">Lead Qualification</h3>
                <p className="text-[12px] text-[#B0AEA8] mt-1">Leads by potential level</p>
              </div>
              <div className="p-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: overview.highPotentialLeads || 0 },
                        { name: 'Medium', value: (overview.totalLeads - overview.highPotentialLeads - (overview.noWebsiteBusinesses || 0)) || 0 },
                        { name: 'Low', value: overview.noWebsiteBusinesses || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAFAF8",
                        border: "1px solid #E8E5DF",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Area Heatmap + Top Areas */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AreaHeatmap
              data={areaDensityData?.data || []}
              loading={areaDensityLoading}
              error={areaDensityError}
            />
            <TopAreasChart
              data={topAreasData?.data || []}
              loading={topAreasLoading}
              error={topAreasError}
            />
          </div>

          {/* Recent Scrapes Table */}
          <div className="bg-white rounded-[14px] border border-[#E8E5DF] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="border-b border-[#E8E5DF] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#18181B]">Recent Scraping Activity</h3>
              <p className="text-[12px] text-[#B0AEA8] mt-1">Latest business data collected</p>
            </div>
            <div className="px-5 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E5DF]">
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#B0AEA8] uppercase tracking-[0.08em]">Company</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#B0AEA8] uppercase tracking-[0.08em]">Website</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#B0AEA8] uppercase tracking-[0.08em]">Category</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#B0AEA8] uppercase tracking-[0.08em]">Score</th>
                    <th className="text-left py-3 px-3 text-[12px] font-semibold text-[#B0AEA8] uppercase tracking-[0.08em]">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-[13px] text-[#B0AEA8]">
                      No recent scraping data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B]">Lead Analytics</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">Total Leads</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">All time leads</p>
              </div>
              <div className="text-3xl font-bold text-[#18181B]">{overview.totalLeads}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">High Potential</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">High-potential leads</p>
              </div>
              <div className="text-3xl font-bold text-green-600">{overview.highPotentialLeads}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">Avg Score</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Average lead score</p>
              </div>
              <div className="text-3xl font-bold text-[#18181B]">
                {leadAnalytics?.averageLeadScore || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B]">Automation Analytics</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">Total Runs</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">All automation runs</p>
              </div>
              <div className="text-3xl font-bold text-[#18181B]">{overview.automationRuns}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">Exports</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Generated exports</p>
              </div>
              <div className="text-3xl font-bold text-[#18181B]">{overview.exportsGenerated}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B]">Total Leads</h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Leads from automation</p>
              </div>
              <div className="text-3xl font-bold text-[#18181B]">
                {automationAnalytics?.totalLeadsGenerated || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Audit Tab */}
      {activeTab === 'responsive' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Responsive UI/UX Analytics
            </h2>
            <p className="text-[12.5px] text-[#8E8C86] mt-1">
              Website responsiveness and visual quality metrics
            </p>
          </div>


          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Audited</span>
                <Eye className="h-4 w-4 text-blue-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.responsiveAudited}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Sites audited</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg Responsive</span>
                <Smartphone className="h-4 w-4 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.averageResponsiveScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Average responsive score</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg UI/UX</span>
                <Layout className="h-4 w-4 text-purple-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-purple-600">{overview.averageUIUXScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Average UI/UX score</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Mobile Issues</span>
                <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-red-600">{overview.mobileUnfriendlyWebsites}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Not mobile friendly</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Layout Issues
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Websites with broken layouts</p>
              </div>
              <div className="text-3xl font-bold text-amber-600">{overview.layoutIssuesDetected}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-red-500" />
                  Mobile Unfriendly
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Not optimized for mobile</p>
              </div>
              <div className="text-3xl font-bold text-red-600">{overview.mobileUnfriendlyWebsites}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Audited Total
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Completed responsive audits</p>
              </div>
              <div className="text-3xl font-bold text-green-600">{overview.responsiveAudited}</div>
            </div>
          </div>
        </div>
      )}

      {/* Business Intelligence Tab */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Business Intelligence Analytics
            </h2>
            <p className="text-[12.5px] text-[#8E8C86] mt-1">
              Trust scores, opportunity detection, and website quality metrics
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Analyzed</span>
                <Eye className="h-4 w-4 text-blue-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.intelligenceAnalyzed}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Sites analyzed</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg Trust</span>
                <Shield className="h-4 w-4 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.averageTrustScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Average trust score</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg Quality</span>
                <ThumbsUp className="h-4 w-4 text-purple-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-purple-600">{overview.averageQualityScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Average quality score</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Opportunities</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{overview.highOpportunityLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">High-value leads</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-red-500" />
                  Outdated Websites
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Businesses with outdated design</p>
              </div>
              <div className="text-3xl font-bold text-red-600">{overview.outdatedWebsites}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-orange-500" />
                  No Social Media
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Missing social presence</p>
              </div>
              <div className="text-3xl font-bold text-orange-600">{overview.businessesWithoutSocial}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  High Opportunity
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Top priority leads</p>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{overview.highOpportunityLeads}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Sales Intelligence Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              AI Sales Intelligence Analytics
            </h2>
            <p className="text-[12.5px] text-[#8E8C86] mt-1">
              AI lead scores, conversion predictions, and sales opportunities
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Analyzed</span>
                <Zap className="h-4 w-4 text-amber-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.salesIntelligenceAnalyzed}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Leads analyzed by AI</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Avg AI Score</span>
                <TrendingUp className="h-4 w-4 text-blue-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-blue-600">{overview.averageAiScore}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Average AI lead score</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Urgent</span>
                <AlertCircle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-red-600">{overview.urgentSalesLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Urgent sales leads</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">High Conv.</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{overview.highConversionLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">High conversion probability</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-indigo-500" />
                  Redesign Potential
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Lead requiring website redesign</p>
              </div>
              <div className="text-3xl font-bold text-indigo-600">{overview.highRedesignOpportunities}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-green-500" />
                  SEO Opportunity
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">High SEO improvement potential</p>
              </div>
              <div className="text-3xl font-bold text-green-600">{overview.highSeoOpportunities}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-cyan-500" />
                  Digital Marketing
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">DM opportunity leads</p>
              </div>
              <div className="text-3xl font-bold text-cyan-600">{overview.highRedesignOpportunities}</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Outreach Tab */}
      {activeTab === 'outreach' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <SendHorizonal className="h-5 w-5 text-blue-500" />
              AI Outreach Analytics
            </h2>
            <p className="text-[12.5px] text-[#8E8C86] mt-1">
              Outreach readiness, proposals generated, and CRM pipeline metrics
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Outreach Ready</span>
                <SendHorizonal className="h-4 w-4 text-blue-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.outreachCompleted}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Leads with outreach materials</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Pending</span>
                <Clock className="h-4 w-4 text-amber-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-amber-600">{overview.pendingOutreach}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Awaiting outreach generation</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">High Probability</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{overview.highProbabilityOutreach}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">High success probability</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Responded</span>
                <MessageCircle className="h-4 w-4 text-green-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.outreachResponded}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Leads who responded</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-green-600" />
                  Interested Leads
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Marked as interested in CRM</p>
              </div>
              <div className="text-3xl font-bold text-green-600">{overview.outreachInterested}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-indigo-500" />
                  Redesign Prospects
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Leads with redesign proposals</p>
              </div>
              <div className="text-3xl font-bold text-indigo-600">{overview.outreachInterested}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-green-500" />
                  SEO Proposals
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Leads with SEO proposals ready</p>
              </div>
              <div className="text-3xl font-bold text-green-600">{overview.outreachInterested}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mega AI Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18181B] flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              AI Pipeline Overview
            </h2>
            <p className="text-[12.5px] text-[#8E8C86] mt-1">
              End-to-end AI intelligence pipeline completion metrics
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Total Leads</span>
                <Activity className="h-4 w-4 text-[#18181B]" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-[#18181B]">{overview.totalLeads}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">All leads in system</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Full Pipeline</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.fullPipelineCompleted}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">All 4 phases completed</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Pending</span>
                <AlertCircle className="h-4 w-4 text-amber-500" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-amber-600">{overview.pendingFullPipeline}</div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Waiting for analysis</p>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Completion</span>
                <TrendingUp className="h-4 w-4 text-blue-600" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {overview.totalLeads > 0 ? Math.round((overview.fullPipelineCompleted / overview.totalLeads) * 100) : 0}%
              </div>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Pipeline completion rate</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  Responsive Audit
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Phase 13 completion</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">{overview.responsiveAudited}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Business Intel
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Phase 14 completion</p>
              </div>
              <div className="text-3xl font-bold text-emerald-600">{overview.intelligenceAnalyzed}</div>
            </div>
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="mb-3">
                <h4 className="text-[13px] font-semibold text-[#18181B] flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Sales AI + Outreach
                </h4>
                <p className="text-[11px] text-[#B0AEA8] mt-1">Phase 15 & 16 completion</p>
              </div>
              <div className="text-3xl font-bold text-amber-600">{overview.salesIntelligenceAnalyzed}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}