export enum SearchState {
  IDLE = 'IDLE',
  CREATING_SESSION = 'CREATING_SESSION',
  QUEUED = 'QUEUED',
  STARTING_BROWSER = 'STARTING_BROWSER',
  BROWSER_READY = 'BROWSER_READY',
  SEARCHING_GOOGLE_MAPS = 'SEARCHING_GOOGLE_MAPS',
  SCRAPING_RESULTS = 'SCRAPING_RESULTS',
  PROCESSING_RESULTS = 'PROCESSING_RESULTS',
  SAVING_LEADS = 'SAVING_LEADS',
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  GOOGLE_BLOCKED = 'GOOGLE_BLOCKED',
}

export const ACTIVE_SEARCH_STATES: Set<SearchState> = new Set([
  SearchState.CREATING_SESSION,
  SearchState.QUEUED,
  SearchState.STARTING_BROWSER,
  SearchState.BROWSER_READY,
  SearchState.SEARCHING_GOOGLE_MAPS,
  SearchState.SCRAPING_RESULTS,
  SearchState.PROCESSING_RESULTS,
  SearchState.SAVING_LEADS,
]);

export const TERMINAL_SEARCH_STATES: Set<SearchState> = new Set([
  SearchState.COMPLETED,
  SearchState.STOPPED,
  SearchState.FAILED,
  SearchState.TIMEOUT,
  SearchState.GOOGLE_BLOCKED,
]);

export function isSearchActive(state: SearchState): boolean {
  return ACTIVE_SEARCH_STATES.has(state);
}

export function isSearchTerminal(state: SearchState): boolean {
  return TERMINAL_SEARCH_STATES.has(state);
}

export function isSearchRunning(state: SearchState): boolean {
  return state !== SearchState.IDLE && !isSearchTerminal(state);
}

export function getStateLabel(state: SearchState): string {
  const labels: Record<SearchState, string> = {
    [SearchState.IDLE]: 'Idle',
    [SearchState.CREATING_SESSION]: 'Creating Session',
    [SearchState.QUEUED]: 'Queued',
    [SearchState.STARTING_BROWSER]: 'Starting Browser',
    [SearchState.BROWSER_READY]: 'Browser Ready',
    [SearchState.SEARCHING_GOOGLE_MAPS]: 'Searching Google Maps',
    [SearchState.SCRAPING_RESULTS]: 'Scraping Results',
    [SearchState.PROCESSING_RESULTS]: 'Processing Results',
    [SearchState.SAVING_LEADS]: 'Saving Leads',
    [SearchState.COMPLETED]: 'Completed',
    [SearchState.STOPPED]: 'Stopped',
    [SearchState.FAILED]: 'Failed',
    [SearchState.TIMEOUT]: 'Timeout',
    [SearchState.GOOGLE_BLOCKED]: 'Google Blocked',
  };
  return labels[state] || state;
}

export function getStateColor(state: SearchState): string {
  const colors: Record<SearchState, string> = {
    [SearchState.IDLE]: '#8E8C86',
    [SearchState.CREATING_SESSION]: '#1D4ED8',
    [SearchState.QUEUED]: '#D97706',
    [SearchState.STARTING_BROWSER]: '#1D4ED8',
    [SearchState.BROWSER_READY]: '#1D4ED8',
    [SearchState.SEARCHING_GOOGLE_MAPS]: '#1D4ED8',
    [SearchState.SCRAPING_RESULTS]: '#1D4ED8',
    [SearchState.PROCESSING_RESULTS]: '#1D4ED8',
    [SearchState.SAVING_LEADS]: '#15803D',
    [SearchState.COMPLETED]: '#15803D',
    [SearchState.STOPPED]: '#D97706',
    [SearchState.FAILED]: '#DC2626',
    [SearchState.TIMEOUT]: '#DC2626',
    [SearchState.GOOGLE_BLOCKED]: '#DC2626',
  };
  return colors[state] || '#8E8C86';
}

export function parseSearchState(value: string | undefined | null): SearchState {
  if (!value) return SearchState.IDLE;
  if (Object.values(SearchState).includes(value as SearchState)) {
    return value as SearchState;
  }
  return SearchState.IDLE;
}
