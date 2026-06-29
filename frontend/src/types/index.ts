// TypeScript types and interfaces

export interface SemanticExpansionInfo {
  originalKeyword: string;
  matchedCategory: { id: string; name: string } | null;
  expandedKeywords: Array<{
    keyword: string;
    isPrimary: boolean;
    priority: number;
    categoryGroup: string;
  }>;
  keywordsPreview: string[];
  totalExpandedKeywords: number;
  totalQueries: number;
  coverage: {
    totalQueries: number;
    primaryQueries: number;
    expandedQueries: number;
    groupsCovered: string[];
  };
}

export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  category?: string;
  semanticCategory?: string;
  semanticCategoryName?: string;
  matchedKeyword?: string;
  originalSearchedKeyword?: string;
  searchGroup?: string;
  semanticMatchReason?: string;
  expandedFromKeyword?: string;
  rating?: number;
  reviewsCount?: number;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  workingHours?: string;
  businessStatus?: string;
  plusCode?: string;
  address?: string;
  searchedKeyword?: string;
  searchedLocation?: string;
  searchedArea?: string;
  searchedCity?: string;
  searchedState?: string;
  searchedBusinessType?: string;
  searchedCountry?: string;
  fullSearchQuery?: string;
  source: LeadSource;
  sourceUrl?: string;
  extractionSource?: ExtractionSource;
  sourceMetadata?: Record<string, unknown>;
  sources?: string[];
  relevanceScore?: number;
  validatedCategory?: string;
  locationConfidence?: number;
  categoryConfidence?: number;
  finalConfidence?: number;
  validationStatus?: 'validated' | 'rejected' | 'needs-review';
  rejectionReason?: string;
  aiMatchType?: string;
  aiWarnings?: string[];
  aiQuality?: 'excellent' | 'good' | 'average' | 'poor';
  websiteStatus: WebsiteStatus;
  leadScore: number;

  // Enrichment Pipeline status fields
  enrichmentStatus?: 'pending' | 'running' | 'completed' | 'failed';
  enrichmentStartedAt?: string;
  enrichmentCompletedAt?: string;
  enrichmentError?: string;
  enrichmentProgress?: number;
  enrichmentCurrentStep?: string;

  // Full address fields
  streetAddress?: string;
  secondaryCategories?: string[];
  totalPhotos?: number;
  serviceOptions?: string[];
  ownerClaimed?: boolean;
  placeId?: string;

  // AI Pipeline status fields
  aiStatus?: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  aiProgress?: number;
  aiCurrentStep?: string;
  aiCurrentStepIndex?: number;
  aiTotalSteps?: number;
  aiError?: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  lastAuditAt?: string;
  reportGenerated?: boolean;
  responsiveAuditReady?: boolean;
  intelligenceReady?: boolean;
  outreachReady?: boolean;
  salesAIReady?: boolean;
  reportReady?: boolean;
  aiWebsiteHash?: string;

  auditStatus?: {
    responsive: 'pending' | 'running' | 'completed' | 'failed';
    intelligence: 'pending' | 'running' | 'completed' | 'failed';
    seo: 'pending' | 'running' | 'completed' | 'failed';
    uiux: 'pending' | 'running' | 'completed' | 'failed';
    overall: 'pending' | 'running' | 'completed' | 'failed';
  };
  websiteType?: 'REAL_WEBSITE' | 'SOCIAL_PROFILE' | 'GOOGLE_PROFILE' | 'MARKETPLACE_PROFILE' | 'DIRECTORY_PROFILE' | 'INVALID_URL' | 'NO_WEBSITE';
  websiteClassification?: 'business_website' | 'social_profile' | 'google_business_profile' | 'directory_listing' | 'no_website';
  websiteAuditAllowed?: boolean;
  socialPlatform?: string;
  socialPlatforms?: string[];
  primaryPlatform?: string;
  hasRealWebsite?: boolean;
  hasWebsite?: boolean;
  websiteReachable?: boolean;
  normalizedDomain?: string;
  analysisEligible?: boolean;
  websiteMetadata?: {
    title?: string;
    description?: string;
    favicon?: string;
    logo?: string;
    language?: string;
    httpsEnabled?: boolean;
    canonicalUrl?: string;
    cms?: string;
  };
  websiteQuality?: {
    sslEnabled?: boolean;
    brokenNavigation?: boolean;
    contactPageStatus?: 'found' | 'missing' | 'broken';
    aboutPageStatus?: 'found' | 'missing';
    servicesPageStatus?: 'found' | 'missing';
    hasContactForm?: boolean;
    hasEmail?: boolean;
    hasPhone?: boolean;
    issues: string[];
    score: number;
  };
  websiteIntelligenceCompletedAt?: string;
  seoAudit?: {
    title: string;
    titleLength: number;
    titleOk: boolean;
    metaDescription: string;
    metaDescriptionLength: number;
    metaDescriptionOk: boolean;
    h1Count: number;
    h1Present: boolean;
    h1Text: string;
    robotsMeta: string;
    canonicalUrl: string;
    canonicalPresent: boolean;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogPresent: boolean;
    twitterCard: string;
    twitterPresent: boolean;
    jsonLdPresent: boolean;
    jsonLdTypes: string[];
    hasSchemaOrg: boolean;
    schemaOrgTypes: string[];
    faviconPresent: boolean;
    score: number;
    issues: string[];
  };
  performanceAudit?: {
    loadTimeMs: number;
    domReadyMs: number;
    lcpEstimateMs: number;
    pageWeightKB: number;
    requestCount: number;
    heavyImages: number;
    largeScripts: number;
    renderBlockingResources: number;
    score: number;
    issues: string[];
  };
  websiteOpportunity?: {
    websiteExists: boolean;
    websiteMissing: boolean;
    websiteOutdated: boolean;
    noMobileOptimization: boolean;
    missingContactInfo: boolean;
    missingSeo: boolean;
    missingSocialPresence: boolean;
    noSsl: boolean;
    opportunity: 'high' | 'medium' | 'low';
    explanation: string;
    recommendedServices: string[];
  };
  priority?: 'high' | 'medium' | 'low';
  scoreReasoning?: string[];
  scoreBreakdown?: {
    websitePresence: number;
    contactInfo: number;
    responsiveScore: number;
    seoScore: number;
    socialPresence: number;
    businessStrength: number;
    websiteQuality: number;
  };
  analysisTimestamp?: string;
  generatedEmail?: string;
  generatedWhatsApp?: string;
  generatedCallScript?: string;
  generatedWebsiteProposal?: string;
  outreachSubject?: string;
  analysisReport?: Record<string, unknown>;
  recommendations?: string[];
  responsiveStatus?: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  websiteAudit?: {
    https: boolean;
    pageTitle: string;
    metaDescription: string;
    favicon: string;
    logo: string;
    contactPage: 'found' | 'missing' | 'broken';
    aboutPage: 'found' | 'missing';
    servicesPage: 'found' | 'missing';
    privacyPolicy: boolean;
    terms: boolean;
    cookieBanner: boolean;
    contactForm: boolean;
    emailPresent: boolean;
    phonePresent: boolean;
    socialMedia: Record<string, boolean>;
    cms: string;
    detectedIssues: string[];
    score: number;
  };
  websitePresence?: 'YES' | 'NO';
  detectedWebsiteType?: 'STANDALONE' | 'PROFILE_ONLY' | 'UNKNOWN';
  socialProfiles?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
    tiktok?: string;
    whatsapp?: string;
    snapchat?: string;
    pinterest?: string;
    telegram?: string;
    other?: string[];
  };
  marketplaceLinks?: {
    justdial?: string;
    indiamart?: string;
    amazon?: string;
    flipkart?: string;
    meesho?: string;
    tradeindia?: string;
    other?: string[];
  };
  mapsLinks?: string[];
  qualificationLevel?: 'high-potential' | 'medium-potential' | 'low-potential';
  sslEnabled?: boolean;
  responseTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  hasContactPage?: boolean;
  hasSocialLinks?: {
    facebook?: boolean;
    instagram?: boolean;
    linkedin?: boolean;
    twitter?: boolean;
    aiSummary?: string;
    aiWeaknesses?: string[];
    aiOpportunities?: string[];
  };
  // Contact extraction fields
  emails?: string[];
  phones?: string[];

  // Email discovery fields
  discoveredEmails?: Array<{
    email: string;
    type: string;
    sourcePage: string;
    confidence: number;
    verified: boolean;
  }>;
  primaryEmail?: string;
  emailCount?: number;
  lastEmailScan?: string;
  emailDiscoveryStatus?: 'pending' | 'scanning' | 'completed' | 'failed' | 'skipped';
  emailDiscoveryError?: string;
  emailDiscoveryRetries?: number;

  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
    telegram?: string;
    snapchat?: string;
    pinterest?: string;
    linktree?: string;
    other?: string[];
  };
  contactPages?: string[];
  ownerNames?: string[];
  extractionStatus?: 'success' | 'partial' | 'failed';
  extractedAt?: string;
  analyzedAt?: string;
  aiLeadScore?: number;
  aiQualificationLevel?: 'high-potential' | 'medium-potential' | 'low-potential';
  aiSummary?: string;
  aiWeaknesses?: string[];
  aiOpportunities?: string[];
  aiAnalyzedAt?: string;
  // Responsive UI/UX Audit fields
  responsiveAudit?: {
    mobileFriendly: boolean;
    responsiveLayout: boolean;
    horizontalScroll: boolean;
    overflowIssues: boolean;
    viewportMeta: boolean;
    viewportContent?: string;
    touchFriendly: boolean;
    fontSizeIssues: boolean;
  };
  uiuxAudit?: {
    alignmentIssues: boolean;
    brokenButtons: boolean;
    croppedSections: boolean;
    mobileLayoutBroken: boolean;
    overlappingContent: boolean;
    hiddenContent: boolean;
    navigationIssues: boolean;
    spacingIssues: boolean;
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      element?: string;
      location?: string;
    }>;
  };
  responsiveScore?: number;
  uiuxScore?: number;
  mobileExperienceScore?: number;
  desktopScreenshot?: string;
  mobileScreenshot?: string;
  responsiveAuditCompleted?: boolean;
  responsiveAuditedAt?: string;
  desktopMetrics?: {
    hasHorizontalScroll: boolean;
    bodyOverflowX: boolean;
    elementsOffscreen: number;
    fixedWidthElements: number;
    overlappingElements: number;
  };
  mobileMetrics?: {
    hasHorizontalScroll: boolean;
    bodyOverflowX: boolean;
    elementsOffscreen: number;
    fixedWidthElements: number;
    overlappingElements: number;
  };
  // Business Intelligence fields
  footerAudit?: {
    copyrightDetected: boolean;
    copyrightYear: number | null;
    privacyPolicy: boolean;
    termsPage: boolean;
    footerComplete: boolean;
    footerLinks: number;
    hasContactInfo: boolean;
  };
  socialAudit?: {
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
    twitter: boolean;
    youtube: boolean;
    whatsapp: boolean;
    socialPresenceScore: number;
    detectedLinks: string[];
  };
  contactAudit?: {
    phoneDetected: boolean;
    emailDetected: boolean;
    contactForm: boolean;
    googleMapsEmbed: boolean;
    officeAddress: boolean;
    whatsappButton: boolean;
    contactMethods: number;
  };
  trustScore?: number;
  trustScoreLevel?: 'high' | 'medium' | 'low';
  websiteFreshness?: {
    status: 'fresh' | 'moderate' | 'outdated' | 'very-outdated';
    copyrightYear: number | null;
    yearsBehind: number;
    staleCopyright: boolean;
    designGeneration: string;
    modernStandards: boolean;
  };
  businessOpportunity?: {
    level: 'low' | 'medium' | 'high';
    score: number;
    reasons: string[];
    recommendation: string;
    estimatedValue: 'low' | 'medium' | 'high';
  };
  websiteQualityScore?: number;
  socialPresenceScore?: number;
  copyrightYear?: number;
  aiRecommendation?: {
    summary: string;
    services: string[];
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    keyIssues: string[];
  };
  intelligenceCompleted?: boolean;
  intelligenceAnalyzedAt?: string;
  intelligenceAnalysisDuration?: number;
  intelligenceWebsiteHash?: string;
  websiteIntelligence?: {
    trustScore: number;
    trustScoreLevel: string;
    qualityScore: number;
    seoScore: number;
    uiScore: number;
    uxScore: number;
    performanceScore: number;
    accessibilityScore: number;
    securityScore: number;
    mobileScore: number;
    businessOpportunityScore: number;
    leadPriorityScore: number;
    issues: Array<{
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      category: string;
      description: string;
      detail: string;
      element?: string;
      recommendation: string;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      impact: string;
      effort: string;
      category: string;
    }>;
    metaAnalysis: Record<string, unknown>;
    performanceMetrics: Record<string, unknown>;
    securityDetails: Record<string, unknown>;
    seoDetails: Record<string, unknown>;
    uiDetails: Record<string, unknown>;
    contentAnalysis: Record<string, unknown>;
    categorySpecific: Record<string, unknown> | null;
    analysisDuration: number;
    analyzedAt: string;
  };
  // AI Sales Intelligence fields
  conversionProbability?: 'low' | 'medium' | 'high';
  websiteRedesignPotential?: 'low' | 'medium' | 'high';
  seoOpportunity?: 'low' | 'medium' | 'high';
  digitalMarketingOpportunity?: 'low' | 'medium' | 'high';
  revenuePotential?: 'low' | 'medium' | 'high' | 'enterprise';
  salesPriority?: 'low' | 'normal' | 'high' | 'urgent';
  aiInsight?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendedAction: string;
    expectedOutcome: string;
  };
  competitionLevel?: 'low' | 'medium' | 'high';
  marketOpportunity?: 'low' | 'medium' | 'high';
  salesIntelligenceCompleted?: boolean;
  salesIntelligenceAnalyzedAt?: string;
  // AI Outreach & Proposal fields
  outreachHistory?: Array<{
    type: 'email' | 'whatsapp' | 'proposal' | 'followup';
    content: string;
    subject?: string;
    generatedAt: string;
    status: 'pending' | 'sent' | 'opened' | 'responded';
    followUpStage?: number;
    response?: string;
  }>;
  generatedEmails?: Array<{
    type: string;
    subject: string;
    body: string;
  }>;
  generatedWhatsAppMessages?: Array<{
    type: string;
    content: string;
  }>;
  generatedProposals?: Array<{
    type: string;
    title: string;
    html: string;
    summary: string;
    services: string[];
    estimatedTimeline: string;
    estimatedInvestment: string;
  }>;
  followupSequence?: Array<{
    stage: number;
    type: 'email' | 'whatsapp';
    subject?: string;
    content: string;
    delayDays: number;
  }>;
  outreachProbability?: 'low' | 'medium' | 'high';
  outreachProbabilityScore?: number;
  lastOutreachDate?: string;
  crmOutreachStatus?: 'outreach_pending' | 'email_sent' | 'whatsapp_sent' | 'followup_pending' | 'proposal_sent' | 'responded' | 'interested' | 'closed';
  outreachCompleted?: boolean;

  // Report fields
  report?: {
    generated: boolean;
    generating: boolean;
    generatedAt: string | null;
    reportUrl: string | null;
    reportPath: string | null;
    htmlPath: string | null;
    score: number | null;
    reportVersion: string | null;
    lastAuditAt: string | null;
    progress: {
      stage: string;
      percent: number;
      message: string;
    } | null;
    failureReason: string | null;
  };

  // CRM fields
  pipelineStage: PipelineStage;
  assignedTo?: string;
  lastContactedAt?: string;
  followUpDate?: string;
  followUpNotes?: string;
  leadStatus?: string;
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
  activityHistory?: Array<{ type: string; timestamp: string; details?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFormData {
  companyName: string;
  website?: string;
  phone?: string;
  email?: string;
  industry?: string;
  source: LeadSource;
}

export type LeadSource = 
  | 'google-maps'
  | 'justdial'
  | 'indiamart'
  | 'clutch'
  | 'linkedin'
  | 'directory'
  | 'website'
  | 'manual';

export type ExtractionSource = 
  | 'google-maps'
  | 'justdial'
  | 'indiamart'
  | 'clutch';

export type PipelineStage = 
  | 'new-lead'
  | 'contacted'
  | 'interested'
  | 'not-interested'
  | 'follow-up'
  | 'meeting-scheduled'
  | 'proposal-sent'
  | 'negotiation'
  | 'deal-won'
  | 'deal-lost';

export type ActivityType = 
  | 'lead-created'
  | 'stage-changed'
  | 'note-added'
  | 'note-updated'
  | 'note-deleted'
  | 'follow-up-created'
  | 'follow-up-updated'
  | 'follow-up-deleted'
  | 'follow-up-completed'
  | 'lead-assigned'
  | 'lead-converted';

export type WebsiteStatus = 
  | 'no-website'
  | 'broken-website'
  | 'outdated-website'
  | 'average-website'
  | 'modern-website';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchFilters {
  keyword: string;
  location?: string;
  sources?: string[];
  limit?: number;
  websiteStatus?: string;
  minLeadScore?: number;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  businessType?: string;
  sessionId?: string;
  minConfidence?: number;
  maxConfidence?: number;
  validationStatus?: string;
  aiQuality?: string;
  semanticExpansion?: boolean;
}

export interface PaginatedLeadsResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalLeads: number;
  limit: number;
  data: Lead[];
}

export interface FilterCount {
  value: string;
  count: number;
}

export interface FilterOptions {
  categories: FilterCount[];
  sources: FilterCount[];
  states: string[];
  cities: string[];
  areas: string[];
  businessTypes: FilterCount[];
  qualities: FilterCount[];
  statuses: FilterCount[];
}

export interface FilterCounts {
  total: number;
  withWebsite: number;
  withPhone: number;
  withEmail: number;
  validated: number;
}

export interface LeadSortOptions {
  field?: 'leadScore' | 'createdAt' | 'companyName' | 'rating';
  order?: 'asc' | 'desc';
}

export interface Automation {
  id: string;
  keyword: string;
  location: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  limit: number;
  category?: string;
  status: 'active' | 'paused' | 'failed';
  lastRunAt?: string;
  nextRunAt?: string;
  totalRuns: number;
  lastRunLeads: number;
  lastRunStatus: 'success' | 'partial' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgLeadsPerRun: number;
  totalLeadsGenerated: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

