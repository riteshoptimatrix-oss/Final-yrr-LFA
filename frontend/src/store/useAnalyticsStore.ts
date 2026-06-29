import { create } from 'zustand';
import {
  OverviewAnalytics,
  LeadAnalytics,
  ScrapingAnalytics,
  AutomationAnalytics,
  CategoryCount,
  LeadPerDay,
  DateRange,
  DateRangeFilter,
} from '@/types/analytics';
import { analyticsService } from '@/services/analytics.service';

interface AnalyticsState {
  // Overview
  overview: OverviewAnalytics | null;
  overviewLoading: boolean;
  overviewError: string | null;

  // Lead analytics
  leadAnalytics: LeadAnalytics | null;
  leadAnalyticsLoading: boolean;
  leadAnalyticsError: string | null;

  // Scraping analytics
  scrapingAnalytics: ScrapingAnalytics | null;
  scrapingAnalyticsLoading: boolean;
  scrapingAnalyticsError: string | null;

  // Automation analytics
  automationAnalytics: AutomationAnalytics | null;
  automationAnalyticsLoading: boolean;
  automationAnalyticsError: string | null;

  // Distribution data
  categoryDistribution: CategoryCount[];
  qualificationDistribution: CategoryCount[];
  websiteStatusDistribution: CategoryCount[];
  leadsPerDay: LeadPerDay[];

  // Filter state
  dateRange: DateRange;
  startDate: string | undefined;
  endDate: string | undefined;

  // Actions
  setDateRange: (range: DateRange) => void;
  setCustomDateRange: (start: string, end: string) => void;
  clearDateRange: () => void;

  // Overview actions
  fetchOverview: () => Promise<void>;
  setOverview: (data: OverviewAnalytics | null) => void;
  setOverviewLoading: (loading: boolean) => void;
  setOverviewError: (error: string | null) => void;

  // Lead analytics actions
  fetchLeadAnalytics: () => Promise<void>;
  setLeadAnalytics: (data: LeadAnalytics | null) => void;
  setLeadAnalyticsLoading: (loading: boolean) => void;
  setLeadAnalyticsError: (error: string | null) => void;

  // Scraping analytics actions
  fetchScrapingAnalytics: () => Promise<void>;
  setScrapingAnalytics: (data: ScrapingAnalytics | null) => void;
  setScrapingAnalyticsLoading: (loading: boolean) => void;
  setScrapingAnalyticsError: (error: string | null) => void;

  // Automation analytics actions
  fetchAutomationAnalytics: () => Promise<void>;
  setAutomationAnalytics: (data: AutomationAnalytics | null) => void;
  setAutomationAnalyticsLoading: (loading: boolean) => void;
  setAutomationAnalyticsError: (error: string | null) => void;

  // Distribution actions
  setCategoryDistribution: (data: CategoryCount[]) => void;
  setQualificationDistribution: (data: CategoryCount[]) => void;
  setWebsiteStatusDistribution: (data: CategoryCount[]) => void;
  setLeadsPerDay: (data: LeadPerDay[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Overview state
  overview: null,
  overviewLoading: false,
  overviewError: null,

  // Lead analytics state
  leadAnalytics: null,
  leadAnalyticsLoading: false,
  leadAnalyticsError: null,

  // Scraping analytics state
  scrapingAnalytics: null,
  scrapingAnalyticsLoading: false,
  scrapingAnalyticsError: null,

  // Automation analytics state
  automationAnalytics: null,
  automationAnalyticsLoading: false,
  automationAnalyticsError: null,

  // Distribution data
  categoryDistribution: [],
  qualificationDistribution: [],
  websiteStatusDistribution: [],
  leadsPerDay: [],

  // Filter state
  dateRange: 'last7days',
  startDate: undefined,
  endDate: undefined,

  // Filter actions
  setDateRange: (range: DateRange) => {
    const now = new Date();
    let start: Date | undefined;
    
    switch (range) {
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

    set({
      dateRange: range,
      startDate: start?.toISOString(),
      endDate: now.toISOString(),
    });
  },

  setCustomDateRange: (start: string, end: string) => {
    set({
      dateRange: 'custom',
      startDate: start,
      endDate: end,
    });
  },

  clearDateRange: () => {
    set({
      dateRange: 'last7days',
      startDate: undefined,
      endDate: undefined,
    });
  },

  // Overview actions
  fetchOverview: async () => {
    const { setOverviewLoading, setOverviewError, startDate, endDate } = get();
    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const response = await analyticsService.getOverview({ startDate, endDate });
      if (response.success && response.data) {
        set({ overview: response.data });
      }
    } catch (error: any) {
      setOverviewError(error.message || 'Failed to fetch overview');
    } finally {
      setOverviewLoading(false);
    }
  },

  setOverview: (data: OverviewAnalytics | null) => set({ overview: data }),
  setOverviewLoading: (loading: boolean) => set({ overviewLoading: loading }),
  setOverviewError: (error: string | null) => set({ overviewError: error }),

  // Lead analytics actions
  fetchLeadAnalytics: async () => {
    const { setLeadAnalyticsLoading, setLeadAnalyticsError, startDate, endDate } = get();
    setLeadAnalyticsLoading(true);
    setLeadAnalyticsError(null);

    try {
      const response = await analyticsService.getLeadAnalytics({ startDate, endDate });
      if (response.success && response.data) {
        set({ leadAnalytics: response.data });
      }
    } catch (error: any) {
      setLeadAnalyticsError(error.message || 'Failed to fetch lead analytics');
    } finally {
      setLeadAnalyticsLoading(false);
    }
  },

  setLeadAnalytics: (data: LeadAnalytics | null) => set({ leadAnalytics: data }),
  setLeadAnalyticsLoading: (loading: boolean) => set({ leadAnalyticsLoading: loading }),
  setLeadAnalyticsError: (error: string | null) => set({ leadAnalyticsError: error }),

  // Scraping analytics actions
  fetchScrapingAnalytics: async () => {
    const { setScrapingAnalyticsLoading, setScrapingAnalyticsError, startDate, endDate } = get();
    setScrapingAnalyticsLoading(true);
    setScrapingAnalyticsError(null);

    try {
      const response = await analyticsService.getScrapingAnalytics({ startDate, endDate });
      if (response.success && response.data) {
        set({ scrapingAnalytics: response.data });
      }
    } catch (error: any) {
      setScrapingAnalyticsError(error.message || 'Failed to fetch scraping analytics');
    } finally {
      setScrapingAnalyticsLoading(false);
    }
  },

  setScrapingAnalytics: (data: ScrapingAnalytics | null) => set({ scrapingAnalytics: data }),
  setScrapingAnalyticsLoading: (loading: boolean) => set({ scrapingAnalyticsLoading: loading }),
  setScrapingAnalyticsError: (error: string | null) => set({ scrapingAnalyticsError: error }),

  // Automation analytics actions
  fetchAutomationAnalytics: async () => {
    const { setAutomationAnalyticsLoading, setAutomationAnalyticsError, startDate, endDate } = get();
    setAutomationAnalyticsLoading(true);
    setAutomationAnalyticsError(null);

    try {
      const response = await analyticsService.getAutomationAnalytics({ startDate, endDate });
      if (response.success && response.data) {
        set({ automationAnalytics: response.data });
      }
    } catch (error: any) {
      setAutomationAnalyticsError(error.message || 'Failed to fetch automation analytics');
    } finally {
      setAutomationAnalyticsLoading(false);
    }
  },

  setAutomationAnalytics: (data: AutomationAnalytics | null) => set({ automationAnalytics: data }),
  setAutomationAnalyticsLoading: (loading: boolean) => set({ automationAnalyticsLoading: loading }),
  setAutomationAnalyticsError: (error: string | null) => set({ automationAnalyticsError: error }),

  // Distribution actions
  setCategoryDistribution: (data: CategoryCount[]) => set({ categoryDistribution: data }),
  setQualificationDistribution: (data: CategoryCount[]) => set({ qualificationDistribution: data }),
  setWebsiteStatusDistribution: (data: CategoryCount[]) => set({ websiteStatusDistribution: data }),
  setLeadsPerDay: (data: LeadPerDay[]) => set({ leadsPerDay: data }),
}));
