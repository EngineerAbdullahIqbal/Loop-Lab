/** Supported locales. `en` ships now; `ur` (Urdu) is the first planned translation. */
export type Locale = "en" | "ur";

/** A flat key → string map. Keys are namespaced, e.g. "l01.title". */
export type Catalog = Readonly<Record<string, string>>;
