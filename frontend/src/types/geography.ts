export interface GeographyCountry {
  _id: string;
  name: string;
  iso2: string;
  iso3: string;
  flag: string;
  phonecode: string;
}

export interface GeographyState {
  _id: string;
  name: string;
  countryCode: string;
  isoCode: string;
}

export interface GeographyCity {
  _id: string;
  name: string;
  countryCode: string;
  stateCode: string;
}

export interface GeographyArea {
  _id: string;
  name: string;
  areaName: string;
  formatted: string;
  lat: number;
  lon: number;
  suburb: string | null;
  district: string | null;
  county: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface GeoapifyFeature {
  properties: {
    formatted: string;
    lat: number;
    lon: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    suburb?: string;
    district?: string;
    county?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    result_type?: string;
    neighbourhood?: string;
    quarter?: string;
    hamlet?: string;
    village?: string;
    locality?: string;
    rank?: {
      popularity: number;
      confidence: number;
      match_type?: string;
    };
    address_line1?: string;
    address_line2?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

export interface GeoapifyResponse {
  features: GeoapifyFeature[];
  results?: GeoapifyFeature[];
  query: {
    text: string;
    parsed: {
      city?: string;
      expected_type?: string;
    };
  };
}
