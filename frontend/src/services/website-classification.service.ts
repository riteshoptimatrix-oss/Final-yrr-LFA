export type WebsiteClassificationType =
  | 'BUSINESS_WEBSITE'
  | 'SOCIAL_PROFILE'
  | 'GOOGLE_PROFILE'
  | 'MARKETPLACE_PROFILE'
  | 'DIRECTORY_PROFILE'
  | 'INVALID_URL'
  | 'NO_WEBSITE';

export type WebsiteDisplayType =
  | 'business_website'
  | 'social_profile'
  | 'google_business_profile'
  | 'directory_listing'
  | 'no_website';

export interface WebsiteClassificationResult {
  hasWebsite: boolean;
  websiteType: WebsiteClassificationType;
  websiteClassification: WebsiteDisplayType;
  displayLabel: string;
  platform: string | null;
  domain: string | null;
  normalizedUrl: string | null;
}

const STANDALONE_TLDS = [
  '.com', '.in', '.co.in', '.org', '.net',
  '.ai', '.io', '.dev', '.app',
  '.shop', '.store', '.info', '.biz', '.co',
];

const KNOWN_PLATFORM_DOMAINS = [
  'vercel.app', 'netlify.app', 'pages.dev', 'github.io',
  'shopify.com', 'wixsite.com', 'wordpress.com',
];

const SOCIAL_DOMAINS: Record<string, string> = {
  'instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'fb.com': 'Facebook',
  'linkedin.com': 'LinkedIn',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'twitter.com': 'X',
  'x.com': 'X',
  'threads.net': 'Threads',
  'tiktok.com': 'TikTok',
  'snapchat.com': 'Snapchat',
  'pinterest.com': 'Pinterest',
  'pinterest.in': 'Pinterest',
  'telegram.me': 'Telegram',
  't.me': 'Telegram',
  'wa.me': 'WhatsApp',
  'whatsapp.com': 'WhatsApp',
  'linktr.ee': 'Linktree',
};

const GOOGLE_DOMAINS = [
  'business.google.com',
  'maps.google.com',
  'google.com/maps',
  'goo.gl',
  'g.page',
  'googleusercontent',
];

const MARKETPLACE_DOMAINS = [
  'justdial.com',
  'indiamart.com',
  'tradeindia.com',
  'sulekha.com',
];

const DIRECTORY_DOMAINS = [
  'yellowpages',
  'yellowpages.in',
  'foursquare.com',
  'yelp.com',
  'yelp.in',
  'tripadvisor.com',
  'tripadvisor.in',
  'clutch.co',
  'glassdoor.com',
  'ambitionbox.com',
];

function normalizeUrl(url: string): string {
  let result = url.trim().toLowerCase();
  result = result.replace(/^https?:\/\//, '');
  result = result.replace(/^www\./, '');
  result = result.replace(/\/+$/, '');
  result = result.replace(/\?.*$/, '');
  result = result.replace(/#.*$/, '');
  result = result.replace(/\s+/g, '');
  return result;
}

function extractHostname(normalized: string): string {
  return normalized.split('/')[0];
}

function isStandaloneDomain(hostname: string): boolean {
  for (const tld of STANDALONE_TLDS) {
    if (hostname.endsWith(tld)) return true;
  }
  for (const domain of KNOWN_PLATFORM_DOMAINS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) return true;
  }
  return false;
}

function matchesAny(hostname: string, domains: string[]): boolean {
  for (const domain of domains) {
    if (hostname === domain) return true;
    if (hostname.endsWith('.' + domain)) return true;
    if (domain.endsWith('.') && hostname.startsWith(domain)) return true;
  }
  const fullUrl = hostname + '/';
  for (const domain of domains) {
    if (fullUrl.startsWith(domain)) return true;
  }
  return false;
}

function matchSocial(hostname: string, normalizedFull: string): string | null {
  for (const [domain, label] of Object.entries(SOCIAL_DOMAINS)) {
    if (hostname === domain || hostname.endsWith('.' + domain)) {
      return label;
    }
    if (normalizedFull === domain || normalizedFull.startsWith(domain + '/') || normalizedFull.startsWith('www.' + domain + '/') || normalizedFull === 'www.' + domain) {
      return label;
    }
  }
  return null;
}

export function classifyWebsite(url: string | null | undefined): WebsiteClassificationResult {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return {
      hasWebsite: false,
      websiteType: 'NO_WEBSITE',
      websiteClassification: 'no_website',
      displayLabel: 'No Website',
      platform: null,
      domain: null,
      normalizedUrl: null,
    };
  }

  const normalized = normalizeUrl(url);
  if (!normalized) {
    return {
      hasWebsite: false,
      websiteType: 'INVALID_URL',
      websiteClassification: 'no_website',
      displayLabel: 'Invalid URL',
      platform: null,
      domain: null,
      normalizedUrl: null,
    };
  }

  const hostname = extractHostname(normalized);

  if (!hostname.includes('.')) {
    return {
      hasWebsite: false,
      websiteType: 'INVALID_URL',
      websiteClassification: 'no_website',
      displayLabel: 'Invalid URL',
      platform: null,
      domain: null,
      normalizedUrl: null,
    };
  }

  const socialLabel = matchSocial(hostname, normalized);
  if (socialLabel) {
    return {
      hasWebsite: false,
      websiteType: 'SOCIAL_PROFILE',
      websiteClassification: 'social_profile',
      displayLabel: `${socialLabel} Profile`,
      platform: socialLabel,
      domain: hostname,
      normalizedUrl: normalized,
    };
  }

  if (matchesAny(hostname, GOOGLE_DOMAINS) || normalized.includes('googleusercontent')) {
    return {
      hasWebsite: false,
      websiteType: 'GOOGLE_PROFILE',
      websiteClassification: 'google_business_profile',
      displayLabel: 'Google Business Profile',
      platform: 'Google',
      domain: hostname,
      normalizedUrl: normalized,
    };
  }

  if (matchesAny(hostname, MARKETPLACE_DOMAINS)) {
    const platform = MARKETPLACE_DOMAINS.find(d => hostname === d || hostname.endsWith('.' + d)) || '';
    return {
      hasWebsite: false,
      websiteType: 'MARKETPLACE_PROFILE',
      websiteClassification: 'directory_listing',
      displayLabel: 'Marketplace Listing',
      platform: platform.replace('.com', '').replace('.in', ''),
      domain: hostname,
      normalizedUrl: normalized,
    };
  }

  if (matchesAny(hostname, DIRECTORY_DOMAINS)) {
    return {
      hasWebsite: false,
      websiteType: 'DIRECTORY_PROFILE',
      websiteClassification: 'directory_listing',
      displayLabel: 'Directory Listing',
      platform: hostname.split('.')[0],
      domain: hostname,
      normalizedUrl: normalized,
    };
  }

  if (isStandaloneDomain(hostname)) {
    return {
      hasWebsite: true,
      websiteType: 'BUSINESS_WEBSITE',
      websiteClassification: 'business_website',
      displayLabel: 'Website',
      platform: null,
      domain: hostname,
      normalizedUrl: normalized,
    };
  }

  return {
    hasWebsite: true,
    websiteType: 'BUSINESS_WEBSITE',
    websiteClassification: 'business_website',
    displayLabel: 'Website',
    platform: null,
    domain: hostname,
    normalizedUrl: normalized,
  };
}

export function getWebsiteClassification(url: string | null | undefined): WebsiteClassificationResult {
  return classifyWebsite(url);
}

export const websiteClassification = {
  classify: classifyWebsite,
  getClassification: getWebsiteClassification,
};
