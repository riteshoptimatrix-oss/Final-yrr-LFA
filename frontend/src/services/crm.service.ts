import { apiClient } from "@utils/api-client";
import { Lead, PipelineStage, ActivityType } from '@/types/index';

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  dueDate: string;
  note?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  timestamp: string;
  previousValue?: string;
  updatedValue?: string;
  description: string;
  createdBy: string;
}

export interface CRMStats {
  totalLeads: number;
  leadsByStage: Record<PipelineStage, number>;
  conversionRate: number;
  followUpReminders: number;
  overdueFollowUps: number;
  pipelineVelocity: number;
  totalContacted: number;
  totalInterested: number;
  totalDealsWon: number;
  totalRevenue: number;
}

export interface LeadDetails {
  id: string;
  companyName: string;
  website?: string;
  hasWebsite?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  source?: string;
  stage: PipelineStage;
  leadScore: number;
  lastContactedAt?: string;
  followUpDate?: string;
  followUpNotes?: string;
  hasFollowUp: boolean;
  assignedTo?: string;
  assignedToName?: string;
  notesCount: number;
  lastNote?: string;
  lastNoteDate?: string;
  activityCount: number;
  contactStatus?: string;
  interestStatus?: string;
  salesNotes?: string;
  discussionSummary?: string;
  clientBudget?: number;
  requiredServices?: string[];
  priorityLevel?: string;
  proposalStatus?: string;
  meetingStatus?: string;
  dealValue?: number;
  expectedClosingDate?: string;
  whatsappNumber?: string;
  tags?: string[];
  stageUpdatedAt?: string;
}

export interface CRMAnalytics {
  totalLeads: number;
  totalContacted: number;
  totalInterested: number;
  totalNotInterested: number;
  totalFollowUps: number;
  totalMeetingsScheduled: number;
  totalProposalsSent: number;
  totalNegotiations: number;
  totalDealsWon: number;
  totalDealsLost: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealValue: number;
  followUpsPending: number;
  followUpsOverdue: number;
  leadsByStage: Record<string, number>;
  revenueByStage: Record<string, number>;
}

export interface CRMUpdateFields {
  contactStatus?: string;
  interestStatus?: string;
  followUpDate?: string;
  followUpNotes?: string;
  salesNotes?: string;
  discussionSummary?: string;
  clientBudget?: number;
  requiredServices?: string[];
  priorityLevel?: string;
  proposalStatus?: string;
  meetingStatus?: string;
  assignedTo?: string;
  dealValue?: number;
  expectedClosingDate?: string;
  whatsappNumber?: string;
  tags?: string[];
}

export interface PipelineResponse {
  stages: Array<{
    id: PipelineStage;
    label: string;
    order: number;
    leads: Lead[];
  }>;
}

export class CRMService {
  async getLeads(stage?: string, page = 1, limit = 20): Promise<{ success: boolean; message: string; data: any }> {
    const url = stage ? `/crm/leads?stage=${stage}&page=${page}&limit=${limit}` : `/crm/leads?page=${page}&limit=${limit}`;
    const response = await apiClient.get<{ success: boolean; message: string; data: any }>(url);
    return response;
  }

  async updateStage(leadId: string, stage: PipelineStage): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/crm/stage/${leadId}`, { stage });
    return response;
  }

  async updateLead(leadId: string, fields: CRMUpdateFields): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/crm/update-lead/${leadId}`, fields);
    return response;
  }

  async addNote(leadId: string, content: string): Promise<{ success: boolean; message: string; data: { note: Note } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { note: Note } }>(`/crm/note/${leadId}`, { content });
    return response;
  }

  async updateNote(noteId: string, content: string): Promise<{ success: boolean; message: string; data: { note: Note } }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: { note: Note } }>(`/crm/note/${noteId}`, { content });
    return response;
  }

  async deleteNote(noteId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/crm/note/${noteId}`);
    return response;
  }

  async getNotes(leadId: string): Promise<{ success: boolean; message: string; data: Note[] }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: Note[] }>(`/crm/notes/${leadId}`);
    return response;
  }

  async createFollowUp(leadId: string, dueDate: string, note?: string): Promise<{ success: boolean; message: string; data: { followUp: FollowUp } }> {
    const response = await apiClient.post<{ success: boolean; message: string; data: { followUp: FollowUp } }>(`/crm/followup/${leadId}`, { dueDate, note });
    return response;
  }

  async updateFollowUp(followUpId: string, updates: { dueDate?: string; note?: string; completed?: boolean }): Promise<{ success: boolean; message: string; data: { followUp: FollowUp } }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: { followUp: FollowUp } }>(`/crm/followup/${followUpId}`, updates);
    return response;
  }

  async deleteFollowUp(followUpId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/crm/followup/${followUpId}`);
    return response;
  }

  async getFollowUps(leadId: string): Promise<{ success: boolean; message: string; data: FollowUp[] }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: FollowUp[] }>(`/crm/followups/${leadId}`);
    return response;
  }

  async getActivities(leadId: string, type?: ActivityType, limit = 50): Promise<{ success: boolean; message: string; data: Activity[] }> {
    let url = `/crm/activity/${leadId}?limit=${limit}`;
    if (type) url += `&type=${type}`;
    const response = await apiClient.get<{ success: boolean; message: string; data: Activity[] }>(url);
    return response;
  }

  async getStats(): Promise<{ success: boolean; message: string; data: CRMStats }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: CRMStats }>(`/crm/stats`);
    return response;
  }

  async getAnalytics(): Promise<{ success: boolean; message: string; data: CRMAnalytics }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: CRMAnalytics }>(`/crm/analytics`);
    return response;
  }

  async getLeadDetails(leadId: string): Promise<{ success: boolean; message: string; data: LeadDetails }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: LeadDetails }>(`/crm/lead/${leadId}`);
    return response;
  }

  async getPipeline(): Promise<{ success: boolean; message: string; data: PipelineResponse }> {
    const response = await apiClient.get<{ success: boolean; message: string; data: PipelineResponse }>(`/crm/pipeline`);
    return response;
  }

  async assignLead(leadId: string, userId: string): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/crm/assign/${leadId}`, { userId });
    return response;
  }

  async moveLead(leadId: string, fromStage: PipelineStage, toStage: PipelineStage): Promise<{ success: boolean; message: string; data: any }> {
    const response = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/crm/move/${leadId}`, { fromStage, toStage });
    return response;
  }
}

export const crmService = new CRMService();
