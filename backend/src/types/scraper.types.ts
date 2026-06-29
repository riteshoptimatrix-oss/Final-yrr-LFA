export interface BusinessData {
  id: string;
  companyName: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  rating: number;
  reviewsCount: number;
  source: string;
  leadScore: number;
  createdAt: string;
  area?: string;
  city?: string;
  state?: string;
  businessType: string;
  fullSearchQuery: string;
  locationRelevanceScore: number;
  isLocationValidated: boolean;
}

export interface ScrapeOptions {
  keyword: string;
  location?: string;
  state?: string;
  city?: string;
  area?: string;
  businessType?: string;
  limit?: number;
  sessionId?: string;
  sources?: string[];
}

export interface ScrapeResult {
  success: boolean;
  message: string;
  totalExtracted: number;
  totalStored: number;
  totalDuplicates: number;
  leads: BusinessData[];
  totalFound: number;
  scrapedCount: number;
}
