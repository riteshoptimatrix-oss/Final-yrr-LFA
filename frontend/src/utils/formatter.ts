import { format, parseISO, differenceInDays, differenceInHours } from "date-fns";

/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy 'at' hh:mm a");
}

/**
 * Format a date to just the date portion
 */
export function formatDateOnly(date: string | Date): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy");
}

/**
 * Format a phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return "N/A";
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  // Format as +91 XXXXXXXXXX for Indian numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format website URL
 */
export function formatWebsite(url: string): string {
  if (!url) return "N/A";
  // Remove protocol if present
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Calculate relative time from now
 */
export function timeAgo(date: string | Date): string {
  if (!date) return "Never";
  
  const now = new Date();
  const past = new Date(date);
  const diffInDays = differenceInDays(now, past);
  const diffInHours = differenceInHours(now, past);
  
  if (diffInDays > 7) return formatDate(date);
  if (diffInDays > 0) return `${diffInDays}d ago`;
  if (diffInHours > 0) return `${diffInHours}h ago`;
  
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);
  if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
  
  return "Just now";
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const names = name.trim().split(" ");
  const firstName = names[0] || "";
  const lastName = names[names.length - 1] || "";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
