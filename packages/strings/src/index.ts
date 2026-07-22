import type { Catalog, Locale } from "./types.ts";
import { en } from "./en.ts";

/** Base catalogs shipped with the build. */
const base: Record<Locale, Catalog> = { en, ur: {} };

/**
 * Runtime overlay — lets new lessons register their strings as DATA without
 * editing this package (supports the "a lesson is data" rule, Constitution V).
 */
const overlay: Record<Locale, Record<string, string>> = { en: {}, ur: {} };

/** Register additional strings at runtime (merged over the base catalog). */
export function registerStrings(entries: Record<string, string>, locale: Locale = "en"): void {
  Object.assign(overlay[locale], entries);
}

/** True if `key` resolves in the given locale or the English fallback. */
export function hasKey(key: string, locale: Locale = "en"): boolean {
  return (
    key in overlay[locale] ||
    key in base[locale] ||
    key in overlay.en ||
    key in base.en
  );
}

/**
 * Resolve a string. Order: locale overlay → locale base → English overlay →
 * English base → the key itself (so a missing string is visible, never a crash).
 */
export function t(key: string, locale: Locale = "en"): string {
  return (
    overlay[locale][key] ??
    base[locale][key] ??
    overlay.en[key] ??
    base.en[key] ??
    key
  );
}

/** All known keys for a locale (base + overlay), for completeness checks. */
export function keys(locale: Locale = "en"): string[] {
  return Array.from(new Set([...Object.keys(base[locale]), ...Object.keys(overlay[locale])]));
}

export { en };
export type { Catalog, Locale };
