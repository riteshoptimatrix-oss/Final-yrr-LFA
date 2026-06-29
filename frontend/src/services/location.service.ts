import { apiClient } from "@/utils/api-client";

export interface CountryOption {
  _id: number;
  name: string;
  iso2: string;
  iso3: string;
  phoneCode: string;
  continent: string;
  supported: boolean;
  slug: string;
}

export interface StateOption {
  _id: string;
  countryId: number;
  name: string;
  stateCode: string;
  slug: string;
}

export interface CityOption {
  _id: string;
  stateId: string;
  countryId: number;
  name: string;
  slug: string;
}

export interface AreaOption {
  _id: string;
  cityId: string;
  name: string;
  slug: string;
}

function getFlagEmoji(iso2: string): string {
  const codePoints = iso2.toUpperCase().split("").map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export function formatCountryLabel(country: CountryOption): string {
  return `${getFlagEmoji(country.iso2)} ${country.name}`;
}

export async function fetchCountries(supportedOnly = true): Promise<CountryOption[]> {
  const params = supportedOnly ? "?supported=true" : "";
  const response = await apiClient.get(`/locations/countries${params}`);
  return (response as { data: CountryOption[] }).data;
}

export async function fetchStates(countryId: number): Promise<StateOption[]> {
  const response = await apiClient.get(`/locations/countries/${countryId}/states`);
  return (response as { data: StateOption[] }).data;
}

export async function fetchCities(stateId: string): Promise<CityOption[]> {
  const response = await apiClient.get(`/locations/states/${stateId}/cities`);
  return (response as { data: CityOption[] }).data;
}

export async function fetchAreas(cityId: string): Promise<AreaOption[]> {
  const response = await apiClient.get(`/locations/cities/${cityId}/areas`);
  return (response as { data: AreaOption[] }).data;
}
