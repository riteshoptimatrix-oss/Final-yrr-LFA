import { create } from "zustand";
import { SearchFilters } from '@/types/index';

interface LocationState {
  state: string;
  city: string;
  area: string;
}

interface SearchState {
  filters: SearchFilters;
  country: string;
  location: LocationState;
  savedSearches: SearchFilters[];
  recentSearches: SearchFilters[];
  loading: boolean;
  
  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  setCountry: (country: string) => void;
  setLocation: (location: Partial<LocationState>) => void;
  setState: (state: string) => void;
  setCity: (city: string) => void;
  setArea: (area: string) => void;
  addSavedSearch: (filters: SearchFilters) => void;
  removeSavedSearch: (index: number) => void;
  addRecentSearch: (filters: SearchFilters) => void;
  setLoading: (loading: boolean) => void;
  resetFilters: () => void;
  resetLocation: () => void;
}

const INITIAL_FILTERS: SearchFilters = {
  keyword: "",
  location: "",
  websiteStatus: undefined,
  minLeadScore: undefined,
};

const INITIAL_LOCATION: LocationState = {
  state: '',
  city: '',
  area: '',
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: INITIAL_FILTERS,
  country: "",
  location: INITIAL_LOCATION,
  savedSearches: [],
  recentSearches: [],
  loading: false,

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  setCountry: (country) => set({ country }),
  setLocation: (location) =>
    set((state) => ({
      location: { ...state.location, ...location },
    })),
  setState: (newState) =>
    set((state) => ({
      location: { ...state.location, state: newState },
    })),
  setCity: (city) =>
    set((state) => ({
      location: { ...state.location, city },
    })),
  setArea: (area) =>
    set((state) => ({
      location: { ...state.location, area },
    })),
  addSavedSearch: (filters) =>
    set((state) => ({
      savedSearches: [...state.savedSearches, filters],
    })),
  removeSavedSearch: (index) =>
    set((state) => ({
      savedSearches: state.savedSearches.filter((_, i) => i !== index),
    })),
  addRecentSearch: (filters) =>
    set((state) => ({
      recentSearches: [
        filters,
        ...state.recentSearches.filter(
          (s) =>
            s.keyword !== filters.keyword || s.location !== filters.location
        ),
      ].slice(0, 5), // Keep only last 5 searches
    })),
  setLoading: (loading) => set({ loading }),
  resetFilters: () => set({ filters: INITIAL_FILTERS }),
  resetLocation: () => set({ location: INITIAL_LOCATION }),
}));
