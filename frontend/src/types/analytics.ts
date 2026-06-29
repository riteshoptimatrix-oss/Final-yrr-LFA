// Analytics types for frontend

export type DateRange = 'today' | 'last7days' | 'last30days' | 'custom';

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Lead Analytics
export interface LeadAnalytics {
  totalLeads: number;
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  averageLeadScore: number;
  qualificationDistribution: {
    highPotential: number;
    mediumPotential: number;
    lowPotential: number;
    total: number;
  };
}

// Scraping Analytics
export interface ScrapingAnalytics {
  totalScrapes: number;
  successfulScrapes: number;
  failedScrapes: number;
  successRate: number;
  leadsPerScrape: number;
}

// Automation Analytics
export interface AutomationAnalytics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  totalLeadsGenerated: number;
  exportsGenerated: number;
}

// Overview Analytics
export interface OverviewAnalytics {
  totalLeads: number;
  websitesAnalyzed: number;
  emailsFound: number;
  phoneNumbers: number;
  totalAutomations: number;
  highPotentialLeads: number;
  websitesWithoutSsl: number;
  noWebsiteBusinesses: number;
  emailsExtracted: number;
  automationRuns: number;
  exportsGenerated: number;
  totalScrapes: number;
  scrapingSuccessRate: number;
  // Responsive audit statistics
  responsiveAudited: number;
  averageResponsiveScore: number;
  averageUIUXScore: number;
  mobileUnfriendlyWebsites: number;
  layoutIssuesDetected: number;
  // Business intelligence statistics
  intelligenceAnalyzed: number;
  averageTrustScore: number;
  averageQualityScore: number;
  highOpportunityLeads: number;
  outdatedWebsites: number;
  businessesWithoutSocial: number;
  // AI Sales Intelligence statistics
  salesIntelligenceAnalyzed: number;
  urgentSalesLeads: number;
  highConversionLeads: number;
  averageAiScore: number;
  highSeoOpportunities: number;
  highRedesignOpportunities: number;
  // AI Outreach statistics
  outreachCompleted: number;
  pendingOutreach: number;
  highProbabilityOutreach: number;
  outreachResponded: number;
  outreachInterested: number;
  // Mega AI Pipeline statistics
  fullPipelineCompleted: number;
  pendingFullPipeline: number;
}

// Category Distribution
export interface CategoryCount {
  _id: string;
  count: number;
}

// Lead Per Day
export interface LeadPerDay {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  count: number;
}

// Area Density
export interface AreaDensityItem {
  state: string;
  city: string;
  area: string;
  totalLeads: number;
  densityLevel: 'high' | 'medium' | 'low';
  topCategories: Array<{ category: string; count: number }>;
}

// API Responses
export interface AnalyticsResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface OverviewResponse {
  success: boolean;
  message: string;
  data: OverviewAnalytics;
}

export interface LeadAnalyticsResponse {
  success: boolean;
  message: string;
  data: LeadAnalytics;
}

export interface ScrapingAnalyticsResponse {
  success: boolean;
  message: string;
  data: ScrapingAnalytics;
}

export interface AutomationAnalyticsResponse {
  success: boolean;
  message: string;
  data: AutomationAnalytics;
}
