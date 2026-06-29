"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Square, RefreshCw, Trash2, Download,
  Clock, CheckCircle2, XCircle, Loader2, Activity, Globe,
  MapPin, Layers, Zap, AlertTriangle, Terminal, BarChart3,
  ListOrdered, ShieldAlert, Wifi, WifiOff, Timer,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAutomationMonitor } from "@/hooks/useAutomationMonitor";
import { useAreaAutomation } from "@/hooks/useAreaAutomation";
import { cn } from "@/utils/cn";

const SOURCE_COLORS: Record<string, string> = {
  'google-maps': '#3B82F6',
  'justdial': '#F59E0B',
  'indiamart': '#10B981',
};

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MonitorPage() {
  const {
    sessionId, status, stats, executionLogs, liveLogs,
    socketConnected, currentJobStatus, clearLogs, isLoading,
  } = useAutomationMonitor();

  const {
    sessions, stopAutomation, pauseAutomation, resumeAutomation,
    isStopping,
  } = useAreaAutomation();

  const [autoScroll, setAutoScroll] = useState(true);

  const session = sessions.find(s => s.id === sessionId);
  const isRunning = status?.status === 'running' || currentJobStatus === 'running';

  const progressPercent = useMemo(() => {
    if (!status || status.total === 0) return 0;
    return Math.round((status.processed / status.total) * 100);
  }, [status]);

  const leadsBySourceData = useMemo(() => {
    if (!stats?.leadsBySource) return [];
    return Object.entries(stats.leadsBySource).map(([source, count]) => ({
      name: source,
      value: count,
      color: SOURCE_COLORS[source] || '#6B7280',
    }));
  }, [stats]);

  const chartData = useMemo(() => {
    if (!executionLogs || executionLogs.length === 0) return [];
    return executionLogs
      .filter(l => l.status === 'completed' || l.status === 'failed')
      .sort((a, b) => new Date(a.startedAt || 0).getTime() - new Date(b.startedAt || 0).getTime())
      .slice(0, 30)
      .map(l => ({
        name: l.area.length > 12 ? l.area.slice(0, 12) + '..' : l.area,
        leads: l.totalLeads,
        duration: l.duration ? Math.round(l.duration / 1000) : 0,
        status: l.status,
        city: l.city,
      }));
  }, [executionLogs]);

  const handleStop = () => {
    if (sessionId) stopAutomation(sessionId);
  };

  const handlePause = () => {
    if (sessionId) pauseAutomation(sessionId);
  };

  const handleResume = () => {
    if (sessionId) resumeAutomation(sessionId);
  };

  const handleExport = () => {
    if (!executionLogs.length) return;
    const csv = [
      ['Area', 'City', 'State', 'BusinessType', 'Status', 'Leads', 'Duration', 'Error', 'Started', 'Completed'].join(','),
      ...executionLogs.map(l => [
        `"${l.area}"`, `"${l.city}"`, `"${l.state}"`, `"${l.businessType}"`,
        l.status, l.totalLeads, l.duration ? formatDuration(l.duration) : '', `"${l.error || ''}"`,
        l.startedAt || '', l.completedAt || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-${sessionId}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Link href="/automation">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {session?.name || 'Automation Monitor'}
                </h1>
                <AnimatePresence>
                  {socketConnected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                    >
                      <Wifi className="h-3 w-3" />
                      Live
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                    >
                      <WifiOff className="h-3 w-3" />
                      Polling
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {session?.businessTypes?.join(', ') || 'Real-time execution monitor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="border-[#E5E7EB] bg-white">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} className="border-[#E5E7EB] bg-white">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Logs
            </Button>
            {isRunning ? (
              <>
                <Button variant="outline" size="sm" onClick={handlePause} className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100">
                  <Square className="h-4 w-4 mr-1.5" />
                  Pause
                </Button>
                <Button variant="destructive" size="sm" onClick={handleStop} disabled={isStopping}>
                  {isStopping ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Square className="h-4 w-4 mr-1.5" />}
                  Stop
                </Button>
              </>
            ) : status?.status === 'paused' || status?.status === 'completed' ? (
              <Button size="sm" onClick={handleResume} className="bg-[#2563EB] hover:bg-blue-600 text-white">
                <Play className="h-4 w-4 mr-1.5" />
                Resume
              </Button>
            ) : null}
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "rounded-xl border p-4 sm:p-6 mb-6 transition-colors",
            isRunning ? "bg-blue-50 border-blue-200" :
              status?.status === 'completed' ? "bg-green-50 border-green-200" :
                status?.status === 'failed' ? "bg-red-50 border-red-200" :
                  status?.status === 'paused' ? "bg-amber-50 border-amber-200" :
                    "bg-gray-50 border-gray-200"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {isRunning ? (
                <span className="relative flex h-10 w-10 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500 items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </span>
                </span>
              ) : status?.status === 'completed' ? (
                <span className="flex h-10 w-10 shrink-0 rounded-full bg-green-500 items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </span>
              ) : status?.status === 'failed' ? (
                <span className="flex h-10 w-10 shrink-0 rounded-full bg-red-500 items-center justify-center">
                  <XCircle className="h-5 w-5 text-white" />
                </span>
              ) : status?.status === 'paused' ? (
                <span className="flex h-10 w-10 shrink-0 rounded-full bg-amber-500 items-center justify-center">
                  <Square className="h-5 w-5 text-white" />
                </span>
              ) : (
                <span className="flex h-10 w-10 shrink-0 rounded-full bg-gray-400 items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </span>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {isRunning ? 'Running' : status?.status || 'Unknown'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isRunning && status?.currentJob
                    ? `Processing ${status.currentJob.businessType} in ${status.currentJob.area}, ${status.currentJob.city}`
                    : status?.status === 'completed' ? 'All jobs processed successfully'
                      : status?.status === 'failed' ? 'Some jobs failed'
                        : status?.status === 'paused' ? 'Automation paused'
                          : 'Ready'
                  }
                </p>
              </div>
            </div>
            {status && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{progressPercent}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{status.leadsFound}</div>
                  <div className="text-xs text-gray-500">Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(status.uptime)}
                  </div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
              </div>
            )}
          </div>
          {status && status.total > 0 && (
            <div className="mt-4 w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  "h-full rounded-full transition-colors",
                  isRunning ? "bg-blue-500" :
                    progressPercent === 100 ? "bg-green-500" :
                      "bg-gray-400"
                )}
              />
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6"
        >
          {[
            { label: 'Total Jobs', value: stats?.totalJobs ?? 0, icon: ListOrdered, color: 'text-blue-600 bg-blue-50' },
            { label: 'Completed', value: stats?.completedJobs ?? 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
            { label: 'Failed', value: stats?.failedJobs ?? 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
            { label: 'Running', value: stats?.runningJobs ?? 0, icon: Activity, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Zap, color: 'text-purple-600 bg-purple-50' },
            { label: 'Avg Duration', value: formatDuration(stats?.avgJobDuration ?? 0), icon: Timer, color: 'text-gray-600 bg-gray-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Card className="border-[#E5E7EB]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                    <span className={cn("p-1.5 rounded-lg", stat.color)}>
                      <stat.icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Current Job / Live Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Job Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-[#E5E7EB]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Current Job
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {status?.currentJob ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Running
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {status.currentJob.businessType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDuration(status.currentJob.elapsed)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {status.currentJob.area}, {status.currentJob.city}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        {status.currentJob.progress || 'Initializing...'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-6">
                      {isRunning ? 'Waiting for next job...' : 'No active job'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Feed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-[#E5E7EB]">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-gray-500" />
                    Live Feed
                    <span className="text-xs font-normal text-gray-400">({liveLogs.length} entries)</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 px-2 text-xs", autoScroll && "text-blue-600")}
                      onClick={() => setAutoScroll(!autoScroll)}
                    >
                      Auto-scroll
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearLogs}>
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-64 sm:h-80 overflow-y-auto custom-scrollbar">
                    <div className="p-3 space-y-0.5 font-mono text-xs">
                      {liveLogs.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">Waiting for events...</div>
                      ) : (
                        liveLogs.map((log, i) => (
                          <motion.div
                            key={`${log.timestamp}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "flex items-start gap-2 py-1 px-2 rounded hover:bg-gray-50 transition-colors",
                              log.level === 'error' && "bg-red-50/50",
                              log.level === 'success' && "bg-green-50/50",
                              log.level === 'warn' && "bg-amber-50/50",
                            )}
                          >
                            <span className="text-gray-400 w-16 shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className={cn(
                              "w-2 h-2 rounded-full mt-1 shrink-0",
                              log.level === 'error' && "bg-red-500",
                              log.level === 'success' && "bg-green-500",
                              log.level === 'warn' && "bg-amber-500",
                              log.level === 'info' && "bg-blue-500",
                            )} />
                            <span className={cn(
                              "text-gray-700",
                              log.level === 'error' && "text-red-700",
                              log.level === 'success' && "text-green-700",
                              log.level === 'warn' && "text-amber-700",
                            )}>
                              {log.message}
                            </span>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Charts & Errors */}
          <div className="space-y-6">
            {/* Source Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-[#E5E7EB]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    Leads by Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsBySourceData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={leadsBySourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {leadsBySourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend
                            verticalAlign="bottom"
                            height={30}
                            formatter={(value: string) => (
                              <span className="text-xs text-gray-600">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-8">No data yet</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Error Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-[#E5E7EB]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.errorsByArea && stats.errorsByArea.length > 0 ? (
                    <div className="space-y-2">
                      {stats.errorsByArea.slice(0, 5).map((err, i) => (
                        <div key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg p-2">
                          <div className="font-medium text-red-700">
                            {err.area}, {err.city}
                          </div>
                          <div className="text-red-500 mt-0.5 truncate">{err.error}</div>
                          <div className="text-red-400 mt-0.5">{err.count} occurrence{err.count > 1 ? 's' : ''}</div>
                        </div>
                      ))}
                      {stats.errorsByArea.length > 5 && (
                        <div className="text-xs text-gray-400 text-center pt-1">
                          +{stats.errorsByArea.length - 5} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 text-center py-6">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-400" />
                      No errors
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-500" />
                Execution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9CA3AF' }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === 'leads' ? 'Leads' : 'Duration (s)',
                        ]}
                        labelFormatter={(label: string, payload: any[]) => {
                          if (payload?.[0]?.payload) {
                            return `${payload[0].payload.city} / ${label}`;
                          }
                          return label;
                        }}
                      />
                      <Bar dataKey="leads" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">No execution data yet</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Area Progress Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-500" />
                Area Execution Logs
                <span className="text-xs font-normal text-gray-400">({executionLogs.length} entries)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-72 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500">Area</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">City</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Leads</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Duration</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Sources</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                          No execution logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      executionLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50/50">
                          <TableCell className="py-2 text-sm font-medium text-gray-900">{log.area}</TableCell>
                          <TableCell className="py-2 text-sm text-gray-600">{log.city}</TableCell>
                          <TableCell className="py-2 text-sm text-gray-600">{log.businessType}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className={cn(
                              "text-[11px] font-medium",
                              log.status === 'completed' && "bg-green-50 text-green-700 border-green-200",
                              log.status === 'failed' && "bg-red-50 text-red-700 border-red-200",
                              log.status === 'running' && "bg-blue-50 text-blue-700 border-blue-200",
                              log.status === 'pending' && "bg-gray-50 text-gray-500 border-gray-200",
                            )}>
                              {log.status === 'running' && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-sm font-semibold text-gray-900">{log.totalLeads}</TableCell>
                          <TableCell className="py-2 text-sm text-gray-500">{formatDuration(log.duration || 0)}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              {log.sources.slice(0, 2).map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 font-normal">
                                  {s}
                                </Badge>
                              ))}
                              {log.sources.length > 2 && (
                                <span className="text-[10px] text-gray-400">+{log.sources.length - 2}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Job Detail Logs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
        >
          <Card className="border-[#E5E7EB]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-gray-500" />
                Detailed Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 overflow-y-auto custom-scrollbar">
                <div className="p-3 space-y-1 font-mono text-xs">
                  {executionLogs.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No logs yet</div>
                  ) : (
                    executionLogs.slice(0, 50).map((log) => (
                      <details key={log.id} className="group">
                        <summary className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                          <span className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            log.status === 'completed' && "bg-green-500",
                            log.status === 'failed' && "bg-red-500",
                            log.status === 'running' && "bg-blue-500 animate-pulse",
                            log.status === 'pending' && "bg-gray-300",
                          )} />
                          <span className="text-gray-500 w-16 shrink-0">
                            {log.startedAt ? new Date(log.startedAt).toLocaleTimeString() : '--:--:--'}
                          </span>
                          <span className="font-medium text-gray-900">{log.area}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600">{log.city}</span>
                          <span className="ml-auto text-gray-400 text-[10px]">
                            {log.totalLeads} leads | {formatDuration(log.duration || 0)}
                          </span>
                        </summary>
                        <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-1 py-1">
                          {log.logs && log.logs.length > 0 ? (
                            log.logs.map((entry, i) => (
                              <div key={i} className="flex items-start gap-2 py-0.5 text-gray-600">
                                <span className="text-gray-400 w-14 shrink-0">
                                  {new Date(entry.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={cn(
                                  entry.level === 'error' && "text-red-600",
                                  entry.level === 'success' && "text-green-600",
                                  entry.level === 'warn' && "text-amber-600",
                                )}>
                                  {entry.message}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400 py-1">No detailed logs</div>
                          )}
                          {log.error && (
                            <div className="flex items-start gap-2 py-0.5 text-red-600">
                              <span className="text-red-400 w-14 shrink-0">Error:</span>
                              {log.error}
                            </div>
                          )}
                          {log.sourceResults && log.sourceResults.length > 0 && (
                            <div className="flex items-center gap-3 py-1 text-gray-500">
                              {log.sourceResults.map((sr, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {sr.source}: {sr.totalStored} leads
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
