import { Country, State, City } from 'country-state-city';
import type {
  GeographyCountry,
  GeographyState,
  GeographyCity,
  GeographyArea,
  GeoapifyResponse,
  GeoapifyFeature,
} from '@/types/geography';

const GEOAPIFY_BASE = 'https://api.geoapify.com/v1/geocode/autocomplete';

function getGeoapifyKey(): string {
  return process.env.NEXT_PUBLIC_GEOAPIFY_KEY || '';
}

function iso2ToIso3(iso2: string): string {
  const mapping: Record<string, string> = {
    AF: 'AFG', AL: 'ALB', DZ: 'DZA', AS: 'ASM', AD: 'AND', AO: 'AGO', AI: 'AIA',
    AG: 'ATG', AR: 'ARG', AM: 'ARM', AW: 'ABW', AU: 'AUS', AT: 'AUT', AZ: 'AZE',
    BS: 'BHS', BH: 'BHR', BD: 'BGD', BB: 'BRB', BY: 'BLR', BE: 'BEL', BZ: 'BLZ',
    BJ: 'BEN', BM: 'BMU', BT: 'BTN', BO: 'BOL', BA: 'BIH', BW: 'BWA', BR: 'BRA',
    BN: 'BRN', BG: 'BGR', BF: 'BFA', BI: 'BDI', CV: 'CPV', KH: 'KHM', CM: 'CMR',
    CA: 'CAN', KY: 'CYM', CF: 'CAF', TD: 'TCD', CL: 'CHL', CN: 'CHN', CO: 'COL',
    KM: 'COM', CG: 'COG', CD: 'COD', CR: 'CRI', CI: 'CIV', HR: 'HRV', CU: 'CUB',
    CY: 'CYP', CZ: 'CZE', DK: 'DNK', DJ: 'DJI', DM: 'DMA', DO: 'DOM', EC: 'ECU',
    EG: 'EGY', SV: 'SLV', GQ: 'GNQ', ER: 'ERI', EE: 'EST', SZ: 'SWZ', ET: 'ETH',
    FJ: 'FJI', FI: 'FIN', FR: 'FRA', GA: 'GAB', GM: 'GMB', GE: 'GEO', DE: 'DEU',
    GH: 'GHA', GR: 'GRC', GD: 'GRD', GT: 'GTM', GN: 'GIN', GW: 'GNB', GY: 'GUY',
    HT: 'HTI', HN: 'HND', HU: 'HUN', IS: 'ISL', IN: 'IND', ID: 'IDN', IR: 'IRN',
    IQ: 'IRQ', IE: 'IRL', IL: 'ISR', IT: 'ITA', JM: 'JAM', JP: 'JPN', JO: 'JOR',
    KZ: 'KAZ', KE: 'KEN', KI: 'KIR', KP: 'PRK', KR: 'KOR', KW: 'KWT', KG: 'KGZ',
    LA: 'LAO', LV: 'LVA', LB: 'LBN', LS: 'LSO', LR: 'LBR', LY: 'LBY', LI: 'LIE',
    LT: 'LTU', LU: 'LUX', MG: 'MDG', MW: 'MWI', MY: 'MYS', MV: 'MDV', ML: 'MLI',
    MT: 'MLT', MH: 'MHL', MR: 'MRT', MU: 'MUS', MX: 'MEX', FM: 'FSM', MD: 'MDA',
    MC: 'MCO', MN: 'MNG', ME: 'MNE', MA: 'MAR', MZ: 'MOZ', MM: 'MMR', NA: 'NAM',
    NR: 'NRU', NP: 'NPL', NL: 'NLD', NZ: 'NZL', NI: 'NIC', NE: 'NER', NG: 'NGA',
    MK: 'MKD', NO: 'NOR', OM: 'OMN', PK: 'PAK', PW: 'PLW', PS: 'PSE', PA: 'PAN',
    PG: 'PNG', PY: 'PRY', PE: 'PER', PH: 'PHL', PL: 'POL', PT: 'PRT', QA: 'QAT',
    RO: 'ROU', RU: 'RUS', RW: 'RWA', KN: 'KNA', LC: 'LCA', VC: 'VCT', WS: 'WSM',
    SM: 'SMR', ST: 'STP', SA: 'SAU', SN: 'SEN', RS: 'SRB', SC: 'SYC', SL: 'SLE',
    SG: 'SGP', SK: 'SVK', SI: 'SVN', SB: 'SLB', SO: 'SOM', ZA: 'ZAF', SS: 'SSD',
    ES: 'ESP', LK: 'LKA', SD: 'SDN', SR: 'SUR', SE: 'SWE', CH: 'CHE', SY: 'SYR',
    TW: 'TWN', TJ: 'TJK', TZ: 'TZA', TH: 'THA', TL: 'TLS', TG: 'TGO', TO: 'TON',
    TT: 'TTO', TN: 'TUN', TR: 'TUR', TM: 'TKM', TV: 'TUV', UG: 'UGA', UA: 'UKR',
    AE: 'ARE', GB: 'GBR', US: 'USA', UY: 'URY', UZ: 'UZB', VU: 'VUT', VA: 'VAT',
    VE: 'VEN', VN: 'VNM', YE: 'YEM', ZM: 'ZMB', ZW: 'ZWE',
  };
  return mapping[iso2] || iso2;
}

let countriesCacheInitialized: GeographyCountry[] | null = null;

export function getAllCountries(): GeographyCountry[] {
  if (countriesCacheInitialized) return countriesCacheInitialized;
  const raw = Country.getAllCountries();
  const seen = new Set<string>();
  const mapped = raw
    .filter((c) => {
      if (seen.has(c.isoCode)) return false;
      seen.add(c.isoCode);
      return true;
    })
    .map((c) => ({
      _id: c.isoCode,
      name: c.name,
      iso2: c.isoCode,
      iso3: iso2ToIso3(c.isoCode),
      flag: c.flag,
      phonecode: c.phonecode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  countriesCacheInitialized = mapped;
  return mapped;
}

const statesCache = new Map<string, GeographyState[]>();

export function getStatesOfCountry(iso2: string): GeographyState[] {
  const cacheKey = iso2.toUpperCase();
  const cached = statesCache.get(cacheKey);
  if (cached) return cached;
  const raw = State.getStatesOfCountry(cacheKey);
  if (!raw || raw.length === 0) return [];
  const mapped = raw
    .map((s) => ({
      _id: s.isoCode,
      name: s.name,
      countryCode: s.countryCode,
      isoCode: s.isoCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  statesCache.set(cacheKey, mapped);
  return mapped;
}

const citiesCache = new Map<string, GeographyCity[]>();

export function getCitiesOfState(countryCode: string, stateCode: string): GeographyCity[] {
  const cacheKey = `${countryCode.toUpperCase()}-${stateCode.toUpperCase()}`;
  const cached = citiesCache.get(cacheKey);
  if (cached) return cached;
  const raw = City.getCitiesOfState(countryCode, stateCode);
  if (!raw || raw.length === 0) return [];
  const seen = new Set<string>();
  const mapped = raw
    .filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({
      _id: `${c.name}-${c.stateCode}`,
      name: c.name,
      countryCode: c.countryCode,
      stateCode: c.stateCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  citiesCache.set(cacheKey, mapped);
  return mapped;
}

export function getCitiesOfCountry(countryCode: string): GeographyCity[] {
  const cacheKey = `${countryCode.toUpperCase()}-__COUNTRY__`;
  const cached = citiesCache.get(cacheKey);
  if (cached) return cached;
  const raw = City.getCitiesOfCountry(countryCode);
  if (!raw || raw.length === 0) return [];
  const seen = new Set<string>();
  const mapped = raw
    .filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => ({
      _id: `${c.name}-${c.stateCode || 'NA'}`,
      name: c.name,
      countryCode: c.countryCode,
      stateCode: c.stateCode || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  citiesCache.set(cacheKey, mapped);
  return mapped;
}

const areasCache = new Map<string, GeographyArea[]>();
const cityCoordsCache = new Map<string, { lat: number; lon: number }>();
let currentAreaController: AbortController | null = null;

export function cancelAreaSearch(): void {
  if (currentAreaController) {
    currentAreaController.abort();
    currentAreaController = null;
  }
}

function getCountryIso2(name: string): string {
  const all = getAllCountries();
  const found = all.find(c => c.name.toLowerCase() === name.toLowerCase());
  return found?.iso2 || '';
}

async function getCityCoordinates(
  cityName: string,
  stateName: string,
  countryName: string,
): Promise<{ lat: number; lon: number } | null> {
  const key = `${cityName}|${stateName}|${countryName}`.toLowerCase();
  const cached = cityCoordsCache.get(key);
  if (cached) return cached;

  const apiKey = getGeoapifyKey();
  if (!apiKey) return null;

  const searchText = `${cityName} ${stateName} ${countryName}`;
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchText)}&apiKey=${apiKey}&limit=1&lang=en`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lon, lat] = feature.geometry.coordinates;
    const coords = { lat, lon };
    cityCoordsCache.set(key, coords);
    console.log(`[Geoapify] City coords for "${searchText}": ${lat}, ${lon}`);
    return coords;
  } catch {
    return null;
  }
}

function extractAreaName(properties: GeoapifyFeature['properties']): string {
  const fields = [
    properties.name,
    properties.suburb,
    properties.street,
    properties.locality,
    properties.district,
    properties.neighbourhood,
    properties.quarter,
    properties.hamlet,
    properties.village,
  ];
  for (const field of fields) {
    const v = (field || '').trim();
    if (v && v.length > 0) return v;
  }
  return properties.formatted?.trim() || '';
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

export async function searchAreas(
  query: string,
  countryName: string,
  stateName: string,
  cityName: string,
  countryIso2?: string
): Promise<GeographyArea[]> {
  const apiKey = getGeoapifyKey();
  if (!apiKey) {
    console.warn('[Geoapify] No API key configured (NEXT_PUBLIC_GEOAPIFY_KEY)');
    return [];
  }

  if (!query || query.trim().length < 3) return [];
  if (!countryName || !cityName) return [];

  const trimmed = query.trim();
  const statePart = stateName || '';
  const cacheKey = `${trimmed}|${countryName}|${statePart}|${cityName}`.toLowerCase();
  const cached = areasCache.get(cacheKey);
  if (cached) return cached;

  cancelAreaSearch();

  currentAreaController = new AbortController();
  const { signal } = currentAreaController;

  const iso2 = countryIso2 || getCountryIso2(countryName);
  const coords = await getCityCoordinates(cityName, statePart || cityName, countryName);

  const params = new URLSearchParams();
  params.set('text', trimmed);
  params.set('apiKey', apiKey);
  params.set('limit', '15');
  params.set('lang', 'en');
  params.set('type', 'street');

  if (iso2) params.set('filter', `countrycode:${iso2.toLowerCase()}`);
  if (coords) params.set('bias', `proximity:${coords.lon},${coords.lat}`);

  const url = `${GEOAPIFY_BASE}?${params.toString()}`;
  console.log(`[Geoapify] Area search URL: ${url}`);

  const thisController = currentAreaController;

  try {
    const response = await fetch(url, { signal });
    console.log(`[Geoapify] HTTP ${response.status} for "${trimmed}" in ${cityName}`);

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status} ${response.statusText}`);
    }

    const data: GeoapifyResponse = await response.json();
    const rawResults = data.features ?? data.results ?? [];

    console.log(`[Geoapify] Returned ${rawResults.length} features for "${trimmed}"`);

    if (rawResults.length === 0) return [];

    const seenNorm = new Set<string>();
    const cityLower = cityName.toLowerCase();
    const areas: GeographyArea[] = [];

    for (const feature of rawResults) {
      const p = feature.properties;

      const featureCity = (p.city || '').toLowerCase();
      const featureCounty = (p.county || '').toLowerCase();
      const isInCity = featureCity.includes(cityLower) || featureCity.includes(cityLower.split(' ')[0]);
      const isInCounty = featureCounty.includes(cityLower) || featureCounty.includes(cityLower.split(' ')[0]);

      const areaName = extractAreaName(p);
      if (!areaName) continue;

      const norm = normalizeName(areaName);
      if (!norm || seenNorm.has(norm)) continue;
      seenNorm.add(norm);

      areas.push({
        _id: `${norm}-${Math.random().toString(36).slice(2, 8)}`,
        name: areaName,
        areaName,
        formatted: p.formatted || '',
        lat: p.lat,
        lon: p.lon,
        suburb: p.suburb || null,
        district: p.district || null,
        county: p.county || null,
        city: p.city || null,
        state: p.state || null,
        country: p.country || null,
      });
    }

    areas.sort((a, b) => a.areaName.localeCompare(b.areaName));

    console.log(`[Geoapify] Parsed ${areas.length} unique areas for "${trimmed}" in ${cityName}`);
    areas.forEach(a => console.log(`  -> ${a.areaName} (city: ${a.city})`));

    areasCache.set(cacheKey, areas);
    return areas;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    throw err;
  } finally {
    if (currentAreaController === thisController) {
      currentAreaController = null;
    }
  }
}
