export interface LocationParts {
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  location?: string;
}

export interface BuiltLocationQuery {
  locationString: string;
  searchQuery: string;
  segments: string[];
}

function cleanPart(value?: string | null): string {
  return (value || '').trim();
}

export function buildLocationSegments(parts: LocationParts): string[] {
  const segments: string[] = [];
  const area = cleanPart(parts.area);
  const city = cleanPart(parts.city);
  const state = cleanPart(parts.state);
  const country = cleanPart(parts.country);
  const fallback = cleanPart(parts.location);

  if (area) segments.push(area);
  if (city) segments.push(city);
  if (state) segments.push(state);
  if (country) segments.push(country);

  if (segments.length === 0 && fallback) {
    return fallback.split(',').map(s => s.trim()).filter(Boolean);
  }

  return segments;
}

export function buildLocationString(parts: LocationParts): string {
  return buildLocationSegments(parts).join(', ');
}

export function buildMapsSearchQuery(keyword: string, parts: LocationParts): BuiltLocationQuery {
  const businessType = cleanPart(keyword);
  const segments = buildLocationSegments(parts);
  const locationString = segments.join(', ');

  if (!businessType) {
    return { locationString, searchQuery: locationString, segments };
  }

  const searchQuery = locationString
    ? `${businessType} in ${locationString}`
    : businessType;

  return { locationString, searchQuery, segments };
}
