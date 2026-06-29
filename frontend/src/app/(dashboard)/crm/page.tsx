"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  Phone,
  Globe,
  Tag,
  Trophy,
  Target,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  ChevronRight,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Building2,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Lead } from "@/types/index";
import {
  crmService,
  LeadDetails,
  type CRMStats,
  type CRMAnalytics,
  type Note,
  type Activity,
  type CRMUpdateFields,
} from "@/services/crm.service";

const PIPELINE_STAGES = [
  { id: "new-lead", label: "New Lead", color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "contacted", label: "Contacted", color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-50" },
  { id: "interested", label: "Interested", color: "bg-emerald-500", textColor: "text-emerald-600", bgColor: "bg-emerald-50" },
  { id: "not-interested", label: "Not Interested", color: "bg-gray-500", textColor: "text-gray-600", bgColor: "bg-gray-50" },
  { id: "follow-up", label: "Follow Up", color: "bg-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50" },
  { id: "meeting-scheduled", label: "Meeting Scheduled", color: "bg-cyan-500", textColor: "text-cyan-600", bgColor: "bg-cyan-50" },
  { id: "proposal-sent", label: "Proposal Sent", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" },
  { id: "negotiation", label: "Negotiation", color: "bg-rose-500", textColor: "text-rose-600", bgColor: "bg-rose-50" },
  { id: "deal-won", label: "Deal Won", color: "bg-green-600", textColor: "text-green-700", bgColor: "bg-green-50" },
  { id: "deal-lost", label: "Deal Lost", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" },
] as const;

function derivePipelineStage(fields: CRMUpdateFields, currentStage: string): string | null {
  if (fields.interestStatus === "interested") return "interested";
  if (fields.interestStatus === "not-interested") return "not-interested";
  if (fields.interestStatus === "maybe-later") return "follow-up";
  if (fields.contactStatus === "contacted" && fields.interestStatus === undefined) return "contacted";
  if (fields.followUpDate && fields.interestStatus === undefined && fields.contactStatus === undefined) return "follow-up";
  if (fields.proposalStatus === "pending" || fields.proposalStatus === "sent") return "proposal-sent";
  if (fields.proposalStatus === "approved") return "negotiation";
  if (fields.proposalStatus === "rejected") return "deal-lost";
  if (fields.meetingStatus === "scheduled") return "meeting-scheduled";
  return null;
}

function SortableLeadCard({
  lead,
  onClick,
  stageColor,
}: {
  lead: Lead;
  onClick: (lead: Lead) => void;
  stageColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const timeSinceUpdate = lead.stageUpdatedAt
    ? formatTimeAgo(lead.stageUpdatedAt)
    : lead.createdAt
      ? formatTimeAgo(lead.createdAt)
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-white rounded-[11px] border border-[#E8E5DF] p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-[13px] text-[#18181B] leading-tight line-clamp-2">{lead.companyName}</h4>
        {lead.leadScore !== undefined && (
          <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-[7px] ${getScoreColorClass(lead.leadScore)}`}>
            {lead.leadScore}
          </span>
        )}
      </div>
      
      <div className="space-y-1.5">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#B0AEA8]">
            <Phone className="w-3 h-3 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.hasWebsite && lead.website && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#B0AEA8]">
            <Globe className="w-3 h-3 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
        {!lead.hasWebsite && lead.website && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#B0AEA8]">
            <Globe className="w-3 h-3 shrink-0" strokeWidth={1.8} />
            <span className="truncate line-through">{lead.website.replace(/^https?:\/\//, "")}</span>
            <span className="text-[10px] text-[#DC2626] font-medium">Social</span>
          </div>
        )}
        {lead.category && (
          <div className="flex items-center gap-1.5 text-[12px] text-[#B0AEA8]">
            <Tag className="w-3 h-3 shrink-0" strokeWidth={1.8} />
            <span className="truncate">{lead.category}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E8E5DF]">
        <span className="text-[10px] text-[#B0AEA8]">{timeSinceUpdate}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${stageColor}`} />
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  leads,
  onLeadClick,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  const totalDealValue = leads.reduce((sum, l) => sum + ((l as any).dealValue || 0), 0);

  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);

  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: `col-${stage.id}`,
    data: { type: "column" as const, stageId: stage.id },
  });

  return (
    <div className={`bg-white rounded-[14px] border ${isOver ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20' : 'border-[#E8E5DF]'} flex flex-col h-full min-h-[250px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-150`}>
      <div className="p-4 border-b border-[#E8E5DF] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.color}`} />
          <h3 className="font-semibold text-[13.5px] text-[#18181B] truncate">{stage.label}</h3>
          <span className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#1D4ED8] border border-[#C7D2FE] shrink-0">
            {leads.length}
          </span>
        </div>
        {totalDealValue > 0 && (
          <span className="text-[12px] font-semibold text-[#1D4ED8] shrink-0">
            ${totalDealValue.toLocaleString()}
          </span>
        )}
      </div>
      <div ref={droppableRef} className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-0">
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} stageColor={stage.color} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-[#B0AEA8]">
            <div className="w-8 h-8 rounded-[9px] bg-[#F5F3EF] flex items-center justify-center mb-2">
              <Plus className="w-4 h-4 text-[#B0AEA8]" strokeWidth={1.8} />
            </div>
            <p className="text-[11px] font-medium">Drop lead here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CRMAnalyticsCards({ stats, analytics }: { stats?: CRMStats; analytics?: CRMAnalytics }) {
  const items = [
    { label: "Total Leads", value: analytics?.totalLeads ?? stats?.totalLeads ?? 0, icon: Users, color: "text-[#1D4ED8]" },
    { label: "Contacted", value: analytics?.totalContacted ?? 0, icon: Phone, color: "text-purple-600" },
    { label: "Interested", value: analytics?.totalInterested ?? 0, icon: Target, color: "text-emerald-600" },
    { label: "Follow-ups Pending", value: analytics?.followUpsPending ?? 0, icon: Clock, color: "text-orange-600" },
    { label: "Deals Won", value: analytics?.totalDealsWon ?? 0, icon: Trophy, color: "text-green-600" },
    { label: "Revenue", value: analytics?.totalRevenue ?? 0, icon: DollarSign, color: "text-emerald-600", prefix: "$" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-[11px] border border-[#E8E5DF] p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <item.icon className={`w-3.5 h-3.5 ${item.color}`} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">{item.label}</span>
          </div>
          <span className="text-lg font-bold text-[#18181B]">
            {item.prefix || ""}
            {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeadDetailsDrawer({
  lead,
  open,
  onClose,
}: {
  lead: LeadDetails | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [formData, setFormData] = useState<CRMUpdateFields>({});

  useEffect(() => {
    setFormData({});
  }, [lead?.id]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data: notesData } = useQuery({
    queryKey: ["crm-notes", lead?.id],
    queryFn: () => (lead ? crmService.getNotes(lead.id) : null),
    enabled: !!lead && open,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["crm-activities", lead?.id],
    queryFn: () => (lead ? crmService.getActivities(lead.id) : null),
    enabled: !!lead && open,
  });

  const [newNote, setNewNote] = useState("");

  const updateMutation = useMutation({
    mutationFn: (fields: CRMUpdateFields) => {
      if (!lead) throw new Error("No lead selected");
      return crmService.updateLead(lead.id, fields);
    },
    onMutate: async (fields) => {
      await queryClient.cancelQueries({ queryKey: ["crm-pipeline"] });
      await queryClient.cancelQueries({ queryKey: ["crm-analytics"] });

      const previousPipeline = queryClient.getQueryData(["crm-pipeline"]);

      const derivedStage = lead ? derivePipelineStage(fields, lead.stage) : null;

      queryClient.setQueryData(["crm-pipeline"], (old: any) => {
        if (!old?.stages) return old;
        return {
          ...old,
          stages: old.stages.map((stage: any) => {
            if (derivedStage && derivedStage !== stage.id) {
              return {
                ...stage,
                leads: stage.leads.filter((l: any) => (l._id || l.id) !== lead?.id),
              };
            }
            if (derivedStage && derivedStage === stage.id) {
              const exists = stage.leads.some((l: any) => (l._id || l.id) === lead?.id);
              if (!exists && lead) {
                return {
                  ...stage,
                  leads: [{ ...lead, ...fields, pipelineStage: derivedStage, stageUpdatedAt: new Date().toISOString() }, ...stage.leads],
                };
              }
            }
            return {
              ...stage,
              leads: stage.leads.map((l: any) => {
                if ((l._id || l.id) === lead?.id) {
                  return { ...l, ...fields, ...(derivedStage ? { pipelineStage: derivedStage, stageUpdatedAt: new Date().toISOString() } : {}) };
                }
                return l;
              }),
            };
          }),
        };
      });

      return { previousPipeline };
    },
    onError: (_err, _fields, context) => {
      if (context?.previousPipeline) {
        queryClient.setQueryData(["crm-pipeline"], context.previousPipeline);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["crm-lead-details"] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => {
      if (!lead) throw new Error("No lead selected");
      return crmService.addNote(lead.id, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-notes", lead?.id] });
      queryClient.invalidateQueries({ queryKey: ["crm-activities", lead?.id] });
      setNewNote("");
    },
  });

  const handleFieldChange = useCallback((key: keyof CRMUpdateFields, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    updateMutation.mutate({ [key]: value });
  }, [updateMutation]);

  const handleDebouncedChange = useCallback((key: keyof CRMUpdateFields, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateMutation.mutate({ [key]: value });
    }, 600);
  }, [updateMutation]);

  if (!lead) return null;

  const notes: Note[] = notesData?.data || [];
  const activities: Activity[] = activitiesData?.data || [];

  const inputCls =
    "h-8 rounded-[9px] border border-[#E4E1DB] bg-[#FAFAF8] px-3 text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150";

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg bg-white h-full overflow-y-auto transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E8E5DF] z-10 p-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[#18181B] truncate">{lead.companyName}</h2>
            <p className="text-[11px] text-[#B0AEA8] mt-0.5">
              {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.label} · Score: {lead.leadScore}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-[9px] hover:bg-[#F5F3EF] transition-all duration-150 shrink-0"
          >
            <X className="w-4 h-4 text-[#52525B]" strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Contact Info */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Contact</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lead.email && (
                <div>
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Email</Label>
                  <p className="text-[13px] text-[#18181B] truncate mt-1">{lead.email}</p>
                </div>
              )}
              {lead.phone && (
                <div>
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Phone</Label>
                  <p className="text-[13px] text-[#18181B] mt-1">{lead.phone}</p>
                </div>
              )}
              {lead.whatsappNumber && (
                <div>
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">WhatsApp</Label>
                  <p className="text-[13px] text-[#18181B] mt-1">{lead.whatsappNumber}</p>
                </div>
              )}
              {lead.hasWebsite && lead.website && (
                <div className="col-span-2">
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Website</Label>
                  <p className="text-[13px] text-[#18181B] truncate mt-1">{lead.website}</p>
                </div>
              )}
              {!lead.hasWebsite && lead.website && (
                <div className="col-span-2">
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Profile / Social</Label>
                  <p className="text-[13px] text-[#B0AEA8] truncate mt-1">{lead.website}</p>
                </div>
              )}
              {lead.address && (
                <div className="col-span-2">
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Address</Label>
                  <p className="text-[13px] text-[#18181B] mt-1">{lead.address}</p>
                </div>
              )}
              {lead.category && (
                <div>
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Category</Label>
                  <p className="text-[13px] text-[#18181B] mt-1">{lead.category}</p>
                </div>
              )}
              {lead.source && (
                <div>
                  <Label className="text-[10px] text-[#B0AEA8] font-medium">Source</Label>
                  <p className="text-[13px] text-[#18181B] capitalize mt-1">{lead.source}</p>
                </div>
              )}
            </div>
          </section>

          {/* CRM Status */}
          <section className="bg-[#FAFAF8] rounded-[11px] p-4 space-y-3 border border-[#E8E5DF]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">CRM Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Contact Status</Label>
                <select
                  value={formData.contactStatus ?? lead.contactStatus ?? "not-contacted"}
                  onChange={(e) => handleFieldChange("contactStatus", e.target.value)}
                  className={`w-full mt-1 ${inputCls}`}
                >
                  <option value="not-contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Interest Status</Label>
                <select
                  value={formData.interestStatus ?? lead.interestStatus ?? ""}
                  onChange={(e) => handleFieldChange("interestStatus", e.target.value || undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                >
                  <option value="">Select...</option>
                  <option value="interested">Interested</option>
                  <option value="not-interested">Not Interested</option>
                  <option value="maybe-later">Maybe Later</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Priority</Label>
                <select
                  value={formData.priorityLevel ?? lead.priorityLevel ?? ""}
                  onChange={(e) => handleFieldChange("priorityLevel", e.target.value || undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                >
                  <option value="">Select...</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Assigned To</Label>
                <input
                  type="text"
                  value={formData.assignedTo ?? lead.assignedTo ?? ""}
                  onChange={(e) => handleFieldChange("assignedTo", e.target.value)}
                  placeholder="Sales person name"
                  className={`w-full mt-1 ${inputCls}`}
                />
              </div>
            </div>
          </section>

          {/* Follow Up */}
          <section className="bg-[#FAFAF8] rounded-[11px] p-4 space-y-3 border border-[#E8E5DF]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Follow-Up</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Follow-Up Date</Label>
                <input
                  type="date"
                  value={formData.followUpDate ?? (lead.followUpDate ? lead.followUpDate.split("T")[0] : "")}
                  onChange={(e) => handleFieldChange("followUpDate", e.target.value)}
                  className={`w-full mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Expected Closing</Label>
                <input
                  type="date"
                  value={formData.expectedClosingDate ?? (lead.expectedClosingDate ? lead.expectedClosingDate.split("T")[0] : "")}
                  onChange={(e) => handleFieldChange("expectedClosingDate", e.target.value)}
                  className={`w-full mt-1 ${inputCls}`}
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-[#B0AEA8] font-medium">Follow-Up Notes</Label>
              <textarea
                value={formData.followUpNotes ?? lead.followUpNotes ?? ""}
                onChange={(e) => handleDebouncedChange("followUpNotes", e.target.value)}
                rows={2}
                className="w-full mt-1 rounded-[9px] border border-[#E4E1DB] bg-white px-3 py-2 text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
              />
            </div>
          </section>

          {/* Sales Details */}
          <section className="bg-[#FAFAF8] rounded-[11px] p-4 space-y-3 border border-[#E8E5DF]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Sales Details</h3>
            <div>
              <Label className="text-[10px] text-[#B0AEA8] font-medium">Sales Notes</Label>
              <textarea
                value={formData.salesNotes ?? lead.salesNotes ?? ""}
                onChange={(e) => handleDebouncedChange("salesNotes", e.target.value)}
                rows={2}
                className="w-full mt-1 rounded-[9px] border border-[#E4E1DB] bg-white px-3 py-2 text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
              />
            </div>
            <div>
              <Label className="text-[10px] text-[#B0AEA8] font-medium">Discussion Summary</Label>
              <textarea
                value={formData.discussionSummary ?? lead.discussionSummary ?? ""}
                onChange={(e) => handleDebouncedChange("discussionSummary", e.target.value)}
                rows={2}
                className="w-full mt-1 rounded-[9px] border border-[#E4E1DB] bg-white px-3 py-2 text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
              />
            </div>
          </section>

          {/* Deal & Budget */}
          <section className="bg-[#FAFAF8] rounded-[11px] p-4 space-y-3 border border-[#E8E5DF]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8]">Deal & Budget</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Client Budget ($)</Label>
                <input
                  type="number"
                  value={formData.clientBudget ?? lead.clientBudget ?? ""}
                  onChange={(e) => handleFieldChange("clientBudget", e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Deal Value ($)</Label>
                <input
                  type="number"
                  value={formData.dealValue ?? lead.dealValue ?? ""}
                  onChange={(e) => handleFieldChange("dealValue", e.target.value ? Number(e.target.value) : undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Proposal Status</Label>
                <select
                  value={formData.proposalStatus ?? lead.proposalStatus ?? ""}
                  onChange={(e) => handleFieldChange("proposalStatus", e.target.value || undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                >
                  <option value="">Select...</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-[#B0AEA8] font-medium">Meeting Status</Label>
                <select
                  value={formData.meetingStatus ?? lead.meetingStatus ?? ""}
                  onChange={(e) => handleFieldChange("meetingStatus", e.target.value || undefined)}
                  className={`w-full mt-1 ${inputCls}`}
                >
                  <option value="">Select...</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-[#B0AEA8] font-medium">Required Services</Label>
              <input
                type="text"
                value={formData.requiredServices ? (Array.isArray(formData.requiredServices) ? formData.requiredServices.join(", ") : formData.requiredServices) : (lead.requiredServices || []).join(", ")}
                onChange={(e) =>
                  handleFieldChange(
                    "requiredServices",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Website, SEO, Mobile App, Marketing"
                className={`w-full mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-[10px] text-[#B0AEA8] font-medium">Tags</Label>
              <input
                type="text"
                value={formData.tags ? (Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags) : (lead.tags || []).join(", ")}
                onChange={(e) =>
                  handleFieldChange(
                    "tags",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="hot, vip, urgent"
                className={`w-full mt-1 ${inputCls}`}
              />
            </div>
          </section>

          {/* Activity Timeline */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8] mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" strokeWidth={1.8} /> Activity Timeline
            </h3>
            <div className="space-y-2.5">
              {activities.map((activity, index) => (
                <div key={activity.id ?? `activity-${index}`} className="flex items-start gap-2.5 text-[13px]">
                  <div className="mt-0.5 shrink-0">
                    {activity.type.includes("note") ? (
                      <FileText className="w-3.5 h-3.5 text-[#1D4ED8]" strokeWidth={1.8} />
                    ) : activity.type.includes("follow") ? (
                      <Clock className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.8} />
                    ) : activity.type.includes("stage") ? (
                      <TrendingUp className="w-3.5 h-3.5 text-purple-500" strokeWidth={1.8} />
                    ) : activity.type.includes("converted") || activity.type.includes("won") ? (
                      <Trophy className="w-3.5 h-3.5 text-green-600" strokeWidth={1.8} />
                    ) : activity.type.includes("assign") ? (
                      <Users className="w-3.5 h-3.5 text-[#1D4ED8]" strokeWidth={1.8} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#B0AEA8]" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-[#18181B]">{activity.description}</p>
                    <p className="text-[11px] text-[#B0AEA8] mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-[12px] text-[#B0AEA8] italic">No activity recorded yet</p>
              )}
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#B0AEA8] mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" strokeWidth={1.8} /> Notes ({notes.length})
            </h3>
            <div className="space-y-2.5 mb-3">
              {notes.map((note) => (
                <div key={note.id} className="bg-[#FAFAF8] rounded-[9px] p-3 border border-[#E8E5DF]">
                  <p className="text-[13px] text-[#18181B]">{note.content}</p>
                  <p className="text-[11px] text-[#B0AEA8] mt-2">{formatTimeAgo(note.createdAt)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note…"
                className="flex-1 h-9 rounded-[9px] border border-[#E4E1DB] bg-white px-3.5 text-[13px] text-[#18181B] placeholder:text-[#B0AEA8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition-all duration-150"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNote.trim()) {
                    addNoteMutation.mutate(newNote.trim());
                  }
                }}
              />
              <button
                onClick={() => newNote.trim() && addNoteMutation.mutate(newNote.trim())}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="h-9 px-4 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                style={{
                  background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
                  boxShadow: "0 1px 4px rgba(29,78,216,0.25)",
                }}
              >
                Add
              </button>
            </div>
          </section>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const queryClient = useQueryClient();
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const { data: pipeline, isLoading, error: pipelineError } = useQuery({
    queryKey: ["crm-pipeline"],
    queryFn: () => crmService.getPipeline().then((d) => d.data),
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: stats } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: () => crmService.getStats().then((d) => d.data),
    refetchInterval: 15000,
    staleTime: 0,
  });

  const { data: analytics } = useQuery({
    queryKey: ["crm-analytics"],
    queryFn: () => crmService.getAnalytics().then((d) => d.data),
    refetchInterval: 15000,
    staleTime: 0,
  });

  const moveMutation = useMutation({
    mutationFn: ({ leadId, fromStage, toStage }: { leadId: string; fromStage: string; toStage: string }) =>
      crmService.moveLead(leadId, fromStage as any, toStage as any),
    onMutate: async ({ leadId, fromStage, toStage }) => {
      await queryClient.cancelQueries({ queryKey: ["crm-pipeline"] });
      await queryClient.cancelQueries({ queryKey: ["crm-stats"] });
      await queryClient.cancelQueries({ queryKey: ["crm-analytics"] });

      const previousPipeline = queryClient.getQueryData(["crm-pipeline"]);

      queryClient.setQueryData(["crm-pipeline"], (old: any) => {
        if (!old?.stages) return old;
        let movedLead: any = null;
        return {
          ...old,
          stages: old.stages.map((stage: any) => {
            if (stage.id === fromStage) {
              const remaining: any[] = [];
              for (const l of stage.leads) {
                if ((l._id || l.id) === leadId) {
                  movedLead = { ...l, pipelineStage: toStage, stageUpdatedAt: new Date().toISOString() };
                } else {
                  remaining.push(l);
                }
              }
              return { ...stage, leads: remaining };
            }
            if (stage.id === toStage && movedLead) {
              return { ...stage, leads: [movedLead, ...stage.leads] };
            }
            return stage;
          }),
        };
      });

      return { previousPipeline };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPipeline) {
        queryClient.setQueryData(["crm-pipeline"], context.previousPipeline);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      queryClient.invalidateQueries({ queryKey: ["crm-analytics"] });
    },
  });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const lead = active.data.current?.lead as Lead | undefined;
    if (lead) setActiveDragLead(lead);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragLead(null);
      const { active, over } = event;
      if (!over || !active) return;

      const activeLead = active.data.current?.lead as Lead | undefined;
      if (!activeLead) return;

      const overContainer = over.data.current?.sortable?.containerId || over.id;

      let toStage: string;
      if (typeof overContainer === "string" && PIPELINE_STAGES.some((s) => s.id === overContainer)) {
        toStage = overContainer;
      } else {
        const overLead = over.data.current?.lead as Lead | undefined;
        toStage = overLead?.pipelineStage || activeLead.pipelineStage;
      }

      if (toStage && toStage !== activeLead.pipelineStage) {
        moveMutation.mutate({
          leadId: activeLead.id,
          fromStage: activeLead.pipelineStage,
          toStage,
        });
      }
    },
    [moveMutation]
  );

  const handleLeadClick = useCallback(async (lead: Lead) => {
    try {
      const res = await crmService.getLeadDetails(lead.id);
      if (res.success && res.data) {
        setSelectedLead(res.data);
        setDrawerOpen(true);
      }
    } catch {
      setSelectedLead({
        id: lead.id,
        companyName: lead.companyName,
        website: lead.website,
        phone: lead.phone,
        email: (lead as any).email,
        address: lead.address,
        category: lead.category,
        source: lead.source,
        stage: lead.pipelineStage,
        leadScore: lead.leadScore,
        notesCount: 0,
        activityCount: 0,
        hasFollowUp: false,
      } as LeadDetails);
      setDrawerOpen(true);
    }
  }, []);

  const stagesWithLeads = useMemo(() => {
    if (!pipeline?.stages) return PIPELINE_STAGES.map((s) => ({ ...s, leads: [] as Lead[] }));
    return PIPELINE_STAGES.map((stageDef) => {
      const stageData = pipeline.stages.find((s) => s.id === stageDef.id);
      return {
        ...stageDef,
        leads: (stageData?.leads as Lead[]) || [],
      };
    });
  }, [pipeline]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-[13px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)",
            }}
          >
            <Loader2 className="h-6 w-6 text-[#1D4ED8] animate-spin" />
          </div>
          <span className="text-[13.5px] font-medium text-[#52525B]">Loading CRM pipeline…</span>
        </div>
      </div>
    );
  }

  if (pipelineError) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-12 w-12 rounded-[13px] flex items-center justify-center"
            style={{ background: "#FEF2F2" }}
          >
            <AlertCircle className="h-6 w-6 text-[#DC2626]" />
          </div>
          <p className="text-[14px] font-semibold text-[#18181B]">Failed to load CRM pipeline</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] })}
            className="mt-3 flex items-center gap-1.5 h-9 px-4 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 bg-[#F5F3EF] min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #3B60E4 0%, #1D4ED8 100%)",
              boxShadow: "0 1px 6px rgba(29,78,216,0.22)",
            }}
          >
            <BarChart3 className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-[#18181B] tracking-[-0.025em] leading-tight">
              CRM Pipeline
            </h1>
            <p className="text-[12.5px] text-[#8E8C86] mt-0.5 leading-tight">
              Manage leads through your sales workflow
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] border border-[#E4E1DB] bg-white text-[13px] font-medium text-[#52525B] hover:bg-[#F5F3EF] hover:border-[#C9C6BF] transition-all duration-150 shrink-0"
        >
          <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.8} />
          {showAnalytics ? "Hide" : "Show"} Analytics
        </button>
      </div>

      {/* Analytics Cards */}
      {showAnalytics && (
        <div className="mb-6">
          <CRMAnalyticsCards stats={stats} analytics={analytics} />
        </div>
      )}

      {/* Pipeline Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 auto-rows-max">
          {stagesWithLeads.map((stage) => (
            <div key={stage.id} className="min-h-[300px]">
              <PipelineColumn stage={stage} leads={stage.leads} onLeadClick={handleLeadClick} />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeDragLead && (
            <div className="bg-white rounded-[11px] border border-[#E8E5DF] shadow-2xl p-3.5 w-72">
              <h4 className="font-semibold text-[13px] text-[#18181B]">{activeDragLead.companyName}</h4>
              <p className="text-[11px] text-[#B0AEA8] mt-1">Score: {activeDragLead.leadScore}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <LeadDetailsDrawer lead={selectedLead} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedLead(null); }} />
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getScoreColorClass(score: number): string {
  if (score >= 70) return "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]";
  if (score >= 40) return "bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D]";
  return "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]";
}