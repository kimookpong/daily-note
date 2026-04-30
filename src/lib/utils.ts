import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique local ID for IndexedDB records.
 * Format: local_{timestamp}_{randomHex}
 */
export function generateLocalId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `local_${ts}_${rand}`
}

const THAI_DATE_FORMAT = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Bangkok",
})

const THAI_DATETIME_FORMAT = new Intl.DateTimeFormat("th-TH", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Bangkok",
})

/**
 * Format a date value as a Thai date string.
 * Accepts Date, timestamp (ms), or ISO string.
 */
export function formatDate(value: Date | number | string): string {
  if (!value) return ""
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ""
  return THAI_DATE_FORMAT.format(d)
}

/**
 * Format a date-time value as a Thai date + time string.
 */
export function formatDateTime(value: Date | number | string): string {
  if (!value) return ""
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ""
  return THAI_DATETIME_FORMAT.format(d)
}
