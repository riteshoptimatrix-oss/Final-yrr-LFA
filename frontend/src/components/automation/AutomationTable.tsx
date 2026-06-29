'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { AutomationProgress } from "./AutomationProgress"
import { AutomationActionsDropdown } from "./AutomationActionsDropdown"
import type { AreaAutomationSession } from "@/services/area-automation.service"
import { Globe, MapPin, Layers, Hash, Clock, Activity, ExternalLink } from "lucide-react"

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  if (diffMs < 0) return "just now"

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return `${years}y ago`
}

interface AutomationTableProps {
  sessions: AreaAutomationSession[]
  loading?: boolean
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onRestart?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
}

const SkeletonRow = () => (
  <TableRow>
    <TableCell><div className="h-4 w-36 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-14 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse" /></TableCell>
  </TableRow>
)

const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
      <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
    </div>
    <div className="flex items-center gap-2">
      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="flex items-center gap-2">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
    </div>
  </div>
)

function formatCities(cities: string[]): string {
  if (!cities || cities.length === 0) return "—"
  if (cities.length === 1) return cities[0]
  return `${cities[0]} +${cities.length - 1} more`
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + "..."
}

export function AutomationTable({
  sessions,
  loading = false,
  onView,
  onEdit,
  onPause,
  onResume,
  onRestart,
  onDuplicate,
  onDelete,
  onArchive,
}: AutomationTableProps) {
  const renderActions = (session: AreaAutomationSession) => (
    <AutomationActionsDropdown
      sessionId={session.id}
      status={session.status}
      onView={onView}
      onEdit={onEdit}
      onPause={onPause}
      onResume={onResume}
      onRestart={onRestart}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onArchive={onArchive}
    />
  )

  const renderDesktop = () => (
    <div className="hidden md:block border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Name</span>
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Keywords</span>
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Location</span>
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Sources</span>
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Progress</span>
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Updated</span>
            </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">Monitor</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : sessions.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-400 text-sm">
                    No automation sessions found
                  </TableCell>
                </TableRow>
              )
              : sessions.map((session) => {
                  const businessTypesStr = session.businessTypes?.join(", ") || ""
                  return (
                    <TableRow key={session.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-3.5">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {session.name || "Untitled"}
                          </span>
                          {businessTypesStr && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                {truncate(businessTypesStr, 30)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <StatusBadge status={session.status} />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm text-gray-600">
                          {truncate(businessTypesStr || "—", 24)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm text-gray-600">
                          {session.state ? `${session.state}, ` : ""}
                          {formatCities(session.cities || [])}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {(session.sources || []).slice(0, 3).map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[11px] px-1.5 py-0.5 font-normal">
                              {source}
                            </Badge>
                          ))}
                          {(session.sources || []).length > 3 && (
                            <span className="text-[11px] text-gray-400 ml-0.5">
                              +{session.sources.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {session.totalLeads ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 min-w-[120px]">
                        <AutomationProgress
                          completed={session.completedJobs ?? 0}
                          total={session.totalJobs ?? 0}
                        />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {session.updatedAt ? timeAgo(session.updatedAt) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => onView?.(session.id)}
                          title="Live Monitor"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-3.5">
                        {renderActions(session)}
                      </TableCell>
                    </TableRow>
                  )
                })}
        </TableBody>
      </Table>
    </div>
  )

  const renderMobile = () => (
    <div className="md:hidden space-y-3">
      {loading
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        : sessions.length === 0
          ? (
            <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
              No automation sessions found
            </div>
          )
          : sessions.map((session) => {
              const businessTypesStr = session.businessTypes?.join(", ") || ""
              return (
                <div
                  key={session.id}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {session.name || "Untitled"}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={session.status} />
                        <span className="text-xs text-gray-400">
                          {session.updatedAt ? timeAgo(session.updatedAt) : ""}
                        </span>
                      </div>
                    </div>
                    {renderActions(session)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Hash className="h-3 w-3" />
                      <span className="truncate">{truncate(businessTypesStr || "—", 18)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {session.state ? `${session.state}, ` : ""}
                        {formatCities(session.cities || [])}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-gray-400" />
                      <div className="flex items-center gap-1 flex-wrap">
                        {(session.sources || []).slice(0, 2).map((source, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {source}
                          </Badge>
                        ))}
                        {(session.sources || []).length > 2 && (
                          <span className="text-[10px] text-gray-400">
                            +{session.sources.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Leads:</span>
                      <span className="text-sm font-semibold text-gray-900">{session.totalLeads ?? 0}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <AutomationProgress
                      completed={session.completedJobs ?? 0}
                      total={session.totalJobs ?? 0}
                    />
                  </div>
                </div>
              )
            })}
    </div>
  )

  return (
    <>
      {renderDesktop()}
      {renderMobile()}
    </>
  )
}
