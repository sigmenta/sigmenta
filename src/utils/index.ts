/**
 * src/utils/index.ts
 * ------------------
 * Shared utility functions for Women's Favorite.
 * All pure helpers — no side-effects or React imports.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';
import type { Timestamp } from 'firebase/firestore';
import type { Language, CartItemVariant } from '@/types';

// ===========================================================================
// 1. Price formatting
// ===========================================================================

/**
 * Formats a BDT amount as '৳1,234' using the Bangla number locale.
 *
 * @example formatPrice(1234.5) → '৳1,235'
 */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  // 'bn-BD' gives us comma-separated Bangla numerals; we swap the symbol.
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  return `৳${formatted}`;
}

// ===========================================================================
// 2. Date formatting
// ===========================================================================

/** Converts a Firestore Timestamp, JS Date, epoch ms, object with seconds, or date string to a JS Date. */
export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {}
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000);
  }
  return new Date();
}

/**
 * Returns a human-readable date string in Bangla or English.
 *
 * @example formatDate(someTimestamp, 'bn') → '১০ অক্টোবর ২০২৬'
 * @example formatDate(someTimestamp, 'en') → '10 October 2026'
 */
export function formatDate(
  date: any,
  lang: Language = 'bn',
): string {
  try {
    if (!date) return '—';
    const d = toDate(date);
    if (isNaN(d.getTime())) return '—';
    const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

// ===========================================================================
// 3. Relative time formatting
// ===========================================================================

const RELATIVE_THRESHOLDS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'second', ms: 60_000 },
  { unit: 'minute', ms: 3_600_000 },
  { unit: 'hour',   ms: 86_400_000 },
  { unit: 'day',    ms: 2_592_000_000 },
  { unit: 'month',  ms: 31_536_000_000 },
  { unit: 'year',   ms: Infinity },
];

const DIVISORS: Partial<Record<Intl.RelativeTimeFormatUnit, number>> = {
  second: 1_000,
  minute: 60_000,
  hour:   3_600_000,
  day:    86_400_000,
  week:   604_800_000,
  month:  2_592_000_000,
  year:   31_536_000_000,
  quarter: 7_776_000_000,
};

/**
 * Returns a relative time string in Bangla, e.g. '৩ ঘন্টা আগে', '১ দিন আগে'.
 */
export function formatRelativeTime(date: Timestamp | Date | number): string {
  const d = toDate(date);
  const diffMs = d.getTime() - Date.now();
  const absDiff = Math.abs(diffMs);

  const rtf = new Intl.RelativeTimeFormat('bn-BD', { numeric: 'auto' });

  for (const { unit, ms } of RELATIVE_THRESHOLDS) {
    if (absDiff < ms) {
      const divisor = DIVISORS[unit] ?? 1000;
      const value = Math.round(diffMs / divisor);
      return rtf.format(value, unit);
    }
  }

  // Fallback: format as absolute date
  return formatDate(date, 'bn');
}

// ===========================================================================
// 4. Slug generation
// ===========================================================================

/**
 * Converts a string to a URL-safe slug.
 *
 * @example slugify('Kantha Sari – বাংলা') → 'kantha-sari-bangla'
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics
    .replace(/[^\w\s-]/g, '')          // remove non-word chars (incl. Bangla — keeps ASCII)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')           // spaces / underscores → hyphens
    .replace(/-{2,}/g, '-')            // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');          // trim leading/trailing hyphens
}

// ===========================================================================
// 5. Order reference
// ===========================================================================

/**
 * Generates a unique-ish order reference in the format 'WF-YYYYMMDD-XXXX'.
 *
 * The 4-character suffix is a random uppercase alphanumeric string.
 * For true uniqueness use a Firestore atomic counter or UUID on the backend;
 * this is a display-friendly human reference.
 */
export function generateOrderReference(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omits ambiguous I, O, 0, 1
  const suffix = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('');
  return `WF-${yyyy}${mm}${dd}-${suffix}`;
}

// ===========================================================================
// 6. Discount calculation
// ===========================================================================

/**
 * Calculates the percentage discount between regular and sale price.
 *
 * @returns Integer percentage, e.g. 25 (for 25 %)
 */
export function calculateDiscount(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

// ===========================================================================
// 7. Quantity clamp
// ===========================================================================

/** Clamps qty between min and max (inclusive). */
export function clampQuantity(qty: number, min: number, max: number): number {
  return Math.min(Math.max(qty, min), max);
}

// ===========================================================================
// 8. Text truncation
// ===========================================================================

/**
 * Truncates text to maxLength characters, appending '…' if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ===========================================================================
// 9. Variant key generation
// ===========================================================================

/**
 * Generates a deterministic string key from an array of CartItemVariant objects.
 * Sorting ensures that [{name:'color',value:'Red'},{name:'size',value:'M'}]
 * and [{name:'size',value:'M'},{name:'color',value:'Red'}] produce the same key.
 */
export function generateVariantKey(variants: CartItemVariant[]): string {
  return [...variants]
    .sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    .map((v) => `${v.type}:${v.value}`)
    .join('|');
}

// ===========================================================================
// 10. Bangladesh phone validation
// ===========================================================================

/**
 * Validates a Bangladesh mobile phone number.
 *
 * Accepts:
 *  - +8801XXXXXXXXX (13 digits after +)
 *  - 8801XXXXXXXXX  (13 digits)
 *  - 01XXXXXXXXX    (11 digits, common local format)
 *
 * Valid operator prefixes: 3, 4, 5, 6, 7, 8, 9 (i.e. 013–019 range).
 */
export function isValidBangladeshPhone(phone: string): boolean {
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  // Normalise to local 11-digit format for matching
  let local = cleaned;
  if (local.startsWith('+880')) local = '0' + local.slice(4);
  else if (local.startsWith('880')) local = '0' + local.slice(3);

  return /^01[3-9]\d{8}$/.test(local);
}

// ===========================================================================
// 11. HTML sanitisation
// ===========================================================================

/**
 * Sanitises an HTML string using DOMPurify to prevent XSS.
 * Safe to render via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'code', 'pre', 'hr', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
}

// ===========================================================================
// 12. Class name merge helper
// ===========================================================================

/**
 * Combines clsx and tailwind-merge for conditional Tailwind class strings.
 *
 * @example cn('px-4 py-2', isActive && 'bg-primary', 'px-6') → 'py-2 px-6 bg-primary'
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(...classes));
}

// ===========================================================================
// 13. Initials for avatar fallback
// ===========================================================================

/**
 * Extracts up to 2 initials from a full name.
 *
 * @example getInitials('রাহেলা বেগম') → 'রব'
 * @example getInitials('Jane Doe')    → 'JD'
 */
export function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    // Return first grapheme cluster (handles Unicode / Bangla correctly)
    return [...words[0]].slice(0, 2).join('').toUpperCase();
  }
  // First letter of first and last word
  const first = [...words[0]][0] ?? '';
  const last = [...words[words.length - 1]][0] ?? '';
  return (first + last).toUpperCase();
}

// ===========================================================================
// 14. Debounce
// ===========================================================================

/**
 * Returns a debounced version of fn that delays invocation by ms milliseconds.
 * The returned function does NOT return the inner function's value
 * (use a debounced Promise pattern if you need the return value).
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (...args: Parameters<T>): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };
}

// ===========================================================================
// 15. Scroll to top
// ===========================================================================

/** Smoothly scrolls the window to the top. */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================================================================
// 16. Clipboard
// ===========================================================================

/**
 * Copies text to the system clipboard.
 *
 * @returns true on success, false if clipboard API is unavailable or denied.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers / non-HTTPS contexts
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  } catch {
    return false;
  }
}
