import { create } from 'zustand';
import { Lead, Pagination, WebsiteStatus } from '@/types/index';

interface LeadState {
  leads: Lead[];
  selectedLeads: string[];
  loading: boolean;
  error: string | null;
  exportLoading: boolean;
  exportError: string | null;
  aiAnalysisLoading: boolean;
  aiAnalysisError: string | null;
  automationLoading: boolean;
  automationError: string | null;
  extractionLoading: boolean;
  extractionError: string | null;

  pagination: Pagination;
  filters: {
    qualificationLevel?: 'high-potential' | 'medium-potential' | 'low-potential';
    websiteStatus?: WebsiteStatus;
    category?: string;
    minLeadScore?: number;
    maxLeadScore?: number;
    search?: string;
  };

  sort: {
    field: 'leadScore' | 'createdAt' | 'companyName' | 'rating';
    order: 'asc' | 'desc';
  };

  // Actions
  setLeads: (leads: Lead[]) => void;
  addLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  removeLead: (leadId: string) => void;
  updateLead: (leadId: string, lead: Partial<Lead>) => void;
  setSelectedLeads: (leadIds: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExportLoading: (loading: boolean) => void;
  setExportError: (error: string | null) => void;
  setAiAnalysisLoading: (loading: boolean) => void;
  setAiAnalysisError: (error: string | null) => void;
  setAutomationLoading: (loading: boolean) => void;
  setAutomationError: (error: string | null) => void;
  setExtractionLoading: (loading: boolean) => void;
  setExtractionError: (error: string | null) => void;
  setPagination: (pagination: Partial<Pagination>) => void;
  clearLeads: () => void;

  // Filter actions
  setFilters: (filters: Partial<LeadState['filters']>) => void;
  clearFilters: () => void;

  // Sort actions
  setSort: (sort: Partial<LeadState['sort']>) => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  selectedLeads: [],
  loading: false,
  error: null,
  exportLoading: false,
  exportError: null,
  aiAnalysisLoading: false,
  aiAnalysisError: null,
  automationLoading: false,
  automationError: null,
  extractionLoading: false,
  extractionError: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  filters: {
    qualificationLevel: undefined,
    websiteStatus: undefined,
    category: undefined,
    minLeadScore: undefined,
    maxLeadScore: undefined,
    search: undefined,
  },
  sort: {
    field: 'leadScore',
    order: 'desc',
  },

  setLeads: leads => {
    set({ leads, error: null, loading: false });
    console.log(`[zustand] leads store updated: ${leads.length} leads`);
  },

  addLeads: newLeads => {
    set(state => {
      const existingIds = new Set(state.leads.map(l => l.id));
      const uniqueNew = newLeads.filter(l => !existingIds.has(l.id));
      console.log(`[zustand] adding ${uniqueNew.length} new leads (${newLeads.length - uniqueNew.length} duplicates)`);
      return {
        leads: [...uniqueNew, ...state.leads],
      };
    });
  },

  addLead: lead =>
    set(state => {
      const exists = state.leads.some(l => l.id === lead.id);
      if (exists) {
        return {
          leads: state.leads.map(l => (l.id === lead.id ? lead : l)),
        };
      }
      console.log(`[zustand] adding single lead: ${lead.companyName}`);
      return { leads: [lead, ...state.leads] };
    }),

  removeLead: leadId =>
    set(state => ({
      leads: state.leads.filter(lead => lead.id !== leadId),
    })),

  updateLead: (leadId, updates) =>
    set(state => ({
      leads: state.leads.map(lead => (lead.id === leadId ? { ...lead, ...updates } : lead)),
    })),

  setSelectedLeads: leadIds => set({ selectedLeads: leadIds }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
  setExportLoading: loading => set({ exportLoading: loading }),
  setExportError: error => set({ exportError: error }),
  setAiAnalysisLoading: loading => set({ aiAnalysisLoading: loading }),
  setAiAnalysisError: error => set({ aiAnalysisError: error }),
  setAutomationLoading: loading => set({ automationLoading: loading }),
  setAutomationError: error => set({ automationError: error }),
  setExtractionLoading: loading => set({ extractionLoading: loading }),
  setExtractionError: error => set({ extractionError: error }),
  setPagination: pagination =>
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    })),
  clearLeads: () =>
    set({
      leads: [],
      selectedLeads: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
      error: null,
    }),
  setFilters: filters =>
    set(state => ({
      filters: { ...state.filters, ...filters },
    })),
  clearFilters: () =>
    set({
      filters: {
        qualificationLevel: undefined,
        websiteStatus: undefined,
        category: undefined,
        minLeadScore: undefined,
        maxLeadScore: undefined,
        search: undefined,
      },
    }),
  setSort: sort =>
    set(state => ({
      sort: { ...state.sort, ...sort },
    })),
}));
