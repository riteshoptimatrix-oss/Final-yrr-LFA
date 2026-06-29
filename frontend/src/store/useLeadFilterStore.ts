import { create } from 'zustand';
import { FilterOptions, FilterCounts } from '@/types/index';

export interface FilterState {
  search: string;
  category: string;
  source: string;
  state: string;
  city: string;
  area: string;
  businessType: string;
  status: string;
  quality: string;
  confidence: string;
  minConfidence: string;
  maxConfidence: string;
  hasWebsite: string;
  hasPhone: string;
  hasEmail: string;
  socialOnly: boolean;
  verifiedOnly: boolean;
  hasWhatsApp: string;
  validationStatus: string;
  qualificationLevel: string;
  websiteType: string;
  searchSessionId: string;
  sortField: string;
  sortOrder: string;
  page: number;
}

interface FilterOptionsState {
  options: FilterOptions | null;
  counts: FilterCounts | null;
  optionsLoading: boolean;
  countsLoading: boolean;
}

interface LeadFilterStoreState {
  filters: FilterState;
  filterOptions: FilterOptionsState;
  activeChips: string[];
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setMultipleFilters: (partial: Partial<FilterState>) => void;
  resetFilters: () => void;
  resetPage: () => void;
  removeChip: (key: keyof FilterState) => void;
  setOptions: (options: FilterOptions | null) => void;
  setCounts: (counts: FilterCounts | null) => void;
  setOptionsLoading: (loading: boolean) => void;
  setCountsLoading: (loading: boolean) => void;
  getActiveFilters: () => Partial<FilterState>;
  toQueryParams: () => Record<string, string>;
}

const defaultFilters: FilterState = {
  search: '',
  category: '',
  source: '',
  state: '',
  city: '',
  area: '',
  businessType: '',
  status: '',
  quality: '',
  confidence: '',
  minConfidence: '',
  maxConfidence: '',
  hasWebsite: 'all',
  hasPhone: 'all',
  hasEmail: 'all',
  socialOnly: false,
  verifiedOnly: false,
  hasWhatsApp: 'all',
  validationStatus: '',
  qualificationLevel: '',
  websiteType: '',
  searchSessionId: '',
  sortField: '',
  sortOrder: '',
  page: 1,
};

export const useLeadFilterStore = create<LeadFilterStoreState>((set, get) => ({
  filters: { ...defaultFilters },
  filterOptions: {
    options: null,
    counts: null,
    optionsLoading: false,
    countsLoading: false,
  },
  activeChips: [],

  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value, page: key === 'page' ? (value as number) : 1 },
    }));
  },

  setMultipleFilters: (partial) => {
    set(state => ({
      filters: { ...state.filters, ...partial },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  resetPage: () => {
    set(state => ({
      filters: { ...state.filters, page: 1 },
    }));
  },

  removeChip: (key) => {
    set(state => ({
      filters: {
        ...state.filters,
        [key]: key === 'socialOnly' || key === 'verifiedOnly' ? false : key === 'page' ? 1 : '',
      },
    }));
  },

  setOptions: (options) => {
    set(state => ({
      filterOptions: { ...state.filterOptions, options, optionsLoading: false },
    }));
  },

  setCounts: (counts) => {
    set(state => ({
      filterOptions: { ...state.filterOptions, counts, countsLoading: false },
    }));
  },

  setOptionsLoading: (loading) => {
    set(state => ({
      filterOptions: { ...state.filterOptions, optionsLoading: loading },
    }));
  },

  setCountsLoading: (loading) => {
    set(state => ({
      filterOptions: { ...state.filterOptions, countsLoading: loading },
    }));
  },

  getActiveFilters: () => {
    const { filters } = get();
    const active: Partial<FilterState> = {};
    for (const [key, val] of Object.entries(filters)) {
      if (val !== '' && val !== 'all' && val !== false && val !== 1 && key !== 'page') {
        (active as any)[key] = val;
      }
    }
    return active;
  },

  toQueryParams: () => {
    const { filters } = get();
    const params: Record<string, string> = {};

    const booleanKeys = new Set(['hasWebsite', 'hasPhone', 'hasEmail', 'hasWhatsApp']);

    for (const [key, val] of Object.entries(filters)) {
      if (key === 'page') {
        if (val !== 1) params.page = String(val);
      } else if (val !== '' && val !== 'all' && val !== false) {
        if (key === 'socialOnly' || key === 'verifiedOnly') {
          if (val) params[key] = 'true';
        } else if (booleanKeys.has(key)) {
          params[key] = val === 'yes' ? 'true' : 'false';
        } else {
          params[key] = String(val);
        }
      }
    }
    return params;
  },
}));
