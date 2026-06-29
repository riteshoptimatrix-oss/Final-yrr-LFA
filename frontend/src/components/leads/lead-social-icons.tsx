import { Globe, ExternalLink } from "lucide-react";
import { websiteClassification } from "@/services/website-classification.service";

type IconSize = 'sm' | 'md';

export interface SocialIconEntry {
  platform: string;
  url: string;
  displayName: string;
  classification?: string;
}

interface LeadSocialIconsProps {
  items: SocialIconEntry[];
  size?: IconSize;
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'google-business': {
    label: 'Google Business Profile',
    color: '#1A73E8',
    bg: '#E8F0FE',
    icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  },
  'google-maps': {
    label: 'Google Maps',
    color: '#34A853',
    bg: '#E6F4EA',
    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
  },
  'instagram': {
    label: 'Instagram',
    color: '#E4405F',
    bg: '#FDE8EF',
    icon: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm.4 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm5-3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  },
  'facebook': {
    label: 'Facebook',
    color: '#1877F2',
    bg: '#E7F0FD',
    icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  'whatsapp': {
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#E6F9EE',
    icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884',
  },
  'linkedin': {
    label: 'LinkedIn',
    color: '#0A66C2',
    bg: '#E6F0FA',
    icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  'youtube': {
    label: 'YouTube',
    color: '#FF0000',
    bg: '#FDE8E8',
    icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98l5.75 3.02-5.75 3.02z',
  },
  'twitter': {
    label: 'X / Twitter',
    color: '#1DA1F2',
    bg: '#E7F3FD',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  'tiktok': {
    label: 'TikTok',
    color: '#000000',
    bg: '#F5F5F5',
    icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79.01 1.33-.02 2.66-.02 3.99-.76.09-1.52.28-2.25.58-.81.33-1.55.79-2.17 1.33-.84.74-1.49 1.68-1.89 2.73-.36.96-.53 1.97-.49 2.98.02 1.01.25 2.01.66 2.93.9 2.03 2.83 3.59 5.07 4.05 1.12.23 2.28.17 3.37-.16.91-.28 1.75-.73 2.46-1.31.72-.58 1.32-1.27 1.76-2.05.44-.78.76-1.46.9-2.27.11-.65.15-1.31.11-1.97-.03-.65-.16-1.29-.38-1.9-.28-.77-.73-1.48-1.27-2.1-.48-.55-1-1.06-1.55-1.52-.38-.33-.78-.63-1.2-.9-.35-.23-.71-.44-1.08-.62-.28-.14-.57-.25-.87-.34-.06-.99-.01-1.98-.03-2.97',
  },
  'justdial': {
    label: 'JustDial',
    color: '#EE3124',
    bg: '#FDECEB',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z',
  },
  'indiamart': {
    label: 'IndiaMart',
    color: '#F48120',
    bg: '#FEF0E6',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
};

function PlatformIcon({ config, size }: { config: typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG]; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={config.color}
      stroke="none"
    >
      <path d={config.icon} />
    </svg>
  );
}

function SocialIconButton({ item, config, size }: { item: SocialIconEntry; config: typeof PLATFORM_CONFIG[keyof typeof PLATFORM_CONFIG]; size: IconSize }) {
  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={config.label}
      className={`inline-flex items-center justify-center rounded-md ${padding} transition-all duration-150 hover:scale-110 hover:shadow-sm`}
      style={{ backgroundColor: config.bg, color: config.color }}
      onClick={(e) => e.stopPropagation()}
    >
      <PlatformIcon config={config} size={iconSize} />
      <span className="sr-only">{config.label}</span>
    </a>
  );
}

export function LeadSocialIcons({ items, size = 'sm' }: LeadSocialIconsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((item, idx) => {
        const config = PLATFORM_CONFIG[item.platform];
        if (config) {
          return <SocialIconButton key={idx} item={item} config={config} size={size} />;
        }
        return null;
      })}
    </div>
  );
}

const SOCIAL_PLATFORM_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
  youtube: 'youtube',
  twitter: 'twitter',
  tiktok: 'tiktok',
  telegram: 'telegram',
  snapchat: 'snapchat',
  pinterest: 'pinterest',
  linktree: 'google-business',
};

const DISPLAY_NAME_MAP: Record<string, string> = {
  'google-business': 'Google Business Profile',
  'google-maps': 'Google Maps Listing',
  instagram: 'Instagram Profile',
  facebook: 'Facebook Page',
  whatsapp: 'WhatsApp Number',
  linkedin: 'LinkedIn Profile',
  youtube: 'YouTube Channel',
  twitter: 'X (Twitter) Profile',
  telegram: 'Telegram Profile',
  snapchat: 'Snapchat Profile',
  pinterest: 'Pinterest Profile',
  justdial: 'JustDial Listing',
  indiamart: 'IndiaMart Listing',
  tradeindia: 'TradeIndia Listing',
  sulekha: 'Sulekha Listing',
};

export function extractPlatformsFromLead(lead: {
  website?: string | null;
  hasWebsite?: boolean;
  socialLinks?: Record<string, string | string[] | undefined>;
  socialProfiles?: Record<string, string | string[] | undefined>;
  marketplaceLinks?: Record<string, string | string[] | undefined>;
  mapsLinks?: string[];
  websiteClassification?: string;
}): SocialIconEntry[] {
  const entries: SocialIconEntry[] = [];
  const seen = new Set<string>();

  function add(url: string | undefined | null, platform: string, classification: string, displayName: string) {
    if (!url) return;
    const norm = url.trim().toLowerCase();
    if (seen.has(norm)) return;
    seen.add(norm);
    entries.push({ platform, url, classification, displayName });
  }

  if (lead.website) {
    const classification = websiteClassification.classify(lead.website);
    if (classification.websiteType === 'BUSINESS_WEBSITE') {
      add(lead.website, 'business', 'business_website', 'Website');
    } else {
      const platform = classification.platform || classification.websiteType.toLowerCase();
      add(lead.website, platform, classification.websiteClassification, classification.displayLabel);
    }
  }

  if (lead.socialLinks) {
    for (const [key, value] of Object.entries(lead.socialLinks)) {
      if (key === 'other' && Array.isArray(value)) {
        for (const v of value) add(v, 'link', 'social_profile', 'Other Link');
      } else if (typeof value === 'string' && value) {
        const platform = SOCIAL_PLATFORM_MAP[key] || key;
        add(value, platform, 'social_profile', DISPLAY_NAME_MAP[platform] || `${key.charAt(0).toUpperCase() + key.slice(1)} Profile`);
      }
    }
  }

  if (lead.marketplaceLinks) {
    for (const [key, value] of Object.entries(lead.marketplaceLinks)) {
      if (key === 'other' && Array.isArray(value)) {
        for (const v of value) add(v, 'directory', 'directory_listing', 'Directory Listing');
      } else if (typeof value === 'string' && value) {
        add(value, key, 'directory_listing', DISPLAY_NAME_MAP[key] || `${key.charAt(0).toUpperCase() + key.slice(1)} Listing`);
      }
    }
  }

  if (lead.mapsLinks) {
    for (const url of lead.mapsLinks) {
      add(url, 'google-maps', 'google_business_profile', 'Google Maps Listing');
    }
  }

  if (lead.socialProfiles) {
    for (const [key, value] of Object.entries(lead.socialProfiles)) {
      if (key === 'other' && Array.isArray(value)) {
        for (const v of value) add(v, 'link', 'social_profile', 'Other Link');
      } else if (typeof value === 'string' && value) {
        const platform = SOCIAL_PLATFORM_MAP[key] || key;
        add(value, platform, 'social_profile', DISPLAY_NAME_MAP[platform] || `${key.charAt(0).toUpperCase() + key.slice(1)} Profile`);
      }
    }
  }

  return entries;
}

function matchPlatformFromUrl(url: string): string | null {
  const h = url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  const entries = Object.entries(PLATFORM_CONFIG);
  for (const [domain] of entries) {
    if (h.includes(domain) || (domain === 'google-business' && h.includes('business.google'))) return domain;
  }
  return null;
}

function detectPlatformFromUrl(url: string): string {
  return matchPlatformFromUrl(url) || 'website';
}

export function getPlatformIcon(url: string, size: number = 16) {
  const platform = matchPlatformFromUrl(url || '');
  if (platform && PLATFORM_CONFIG[platform]) {
    return <PlatformIcon config={PLATFORM_CONFIG[platform]} size={size} />;
  }
  return <Globe className="h-4 w-4" />;
}

export function getPlatformLabel(url: string): string {
  const platform = matchPlatformFromUrl(url || '');
  if (platform && PLATFORM_CONFIG[platform]) {
    return PLATFORM_CONFIG[platform].label;
  }
  return 'Website';
}

export { PLATFORM_CONFIG };
