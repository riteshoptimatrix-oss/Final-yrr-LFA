// Application configuration

export const APP_NAME = "Lead Finder Agent";
export const APP_URL = typeof window !== "undefined" 
  ? window.location.origin 
  : "";

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  timeout: 30000,
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 12,
  maxLimit: 100,
};

export const LEAD_SOURCES = [
  { value: "google-maps", label: "Google Maps" },
  { value: "justdial", label: "Justdial" },
  { value: "indiamart", label: "IndiaMart" },
  { value: "clutch", label: "Clutch" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "directory", label: "Business Directory" },
  { value: "website", label: "Website" },
  { value: "manual", label: "Manual Entry" },
] as const;

export const PIPELINE_STAGES = [
  { value: "new-lead", label: "New Lead", color: "blue" },
  { value: "contacted", label: "Contacted", color: "purple" },
  { value: "interested", label: "Interested", color: "green" },
  { value: "follow-up", label: "Follow-Up", color: "orange" },
  { value: "proposal-sent", label: "Proposal Sent", color: "yellow" },
  { value: "converted", label: "Converted", color: "teal" },
  { value: "closed", label: "Closed", color: "gray" },
] as const;

export const WEBSITE_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "red" },
  { value: "invalid", label: "Invalid", color: "destructive" },
  { value: "unknown", label: "Unknown", color: "gray" },
] as const;

export const DASHBOARD_STATS = [
  { label: "Total Leads", value: "0", icon: "users" },
  { label: "Website Analysis", value: "0", icon: "globe" },
  { label: "Emails Found", value: "0", icon: "mail" },
  { label: "Phone Numbers", value: "0", icon: "phone" },
] as const;

// Location Configuration Exports
export { INDIAN_STATES } from "./india-states";
export { LOCATION_DATA } from "./location-data";
export type { StateName, CityName, AreaName, LocationTree, SelectedLocation } from "./location-types";
