/**
 * @fileoverview Private helper utilities for list_tabs (comparators, URL → host normalization, regex helpers).
 */
/**
 * Collection of primitive comparators used for sorting fields.
 * All comparators are pure and stable.
 */
export const compare = {
  stringCI: (a: string, b: string): number => a.localeCompare(b, undefined, { sensitivity: "accent" }),
  number: (a: number, b: number): number => a - b,
  boolean: (a: boolean, b: boolean): number => (a === b ? 0 : a ? 1 : -1), // false < true
} as const;

/**
 * Normalize a URL into a semantic host bucket (used for grouping / filtering).
 *
 * Rules:
 *  - http(s)/ws(s)/ftp → lowercase authority host
 *  - file://           → (file)
 *  - chrome://*, chrome-extension://* → (internal)
 *  - about:*           → (about)
 *  - invalid / empty   → (invalid)
 *
 * Rationale:
 *  - Avoid ambiguous empty string buckets.
 *  - Give users filterable, interpretable labels.
 *  - Future schemes can map to new tokens without changing consumers.
 *  - Legacy: formatter still translates deprecated "(no host)" if encountered externally.
 *
 * Examples:
 *  safeHost('https://Example.COM/x')      → 'example.com'
 *  safeHost('file:///Users/me/readme')    → '(file)'
 *  safeHost('chrome://extensions')        → '(internal)'
 *  safeHost('about:blank')                → '(about)'
 *  safeHost('not a url')                  → '(invalid)'
 */
export function safeHost(url: string): string {
  if (typeof url !== "string" || url.trim() === "") return "(invalid)";

  // Fast path for schemes we want to classify without URL throwing (about:blank)
  const lower = url.toLowerCase();
  if (lower.startsWith("about:")) return "(about)";
  if (lower.startsWith("chrome://") || lower.startsWith("chrome-extension://")) return "(internal)";
  if (lower.startsWith("file://")) return "(file)";

  try {
    const u = new URL(url);
    if (u.protocol === "file:") return "(file)"; // fallback if not caught above
    const host = u.host.toLowerCase();
    return host === "" ? "(invalid)" : host;
  } catch {
    return "(invalid)";
  }
}

/**
 * Compile a case-insensitive RegExp when a non-empty pattern is supplied.
 * Silently returns undefined for invalid patterns to avoid throwing inside
 * the tool pathway (caller may decide later to surface pattern issues).
 */
export function compileOptionalRegex(pattern?: string): RegExp | undefined {
  if (pattern === undefined || pattern === null || pattern === "") return undefined;
  try {
    return new RegExp(pattern, "i");
  } catch {
    return undefined; // Invalid pattern: ignore silently (could surface later if desired)
  }
}

/**
 * Boolean helper to test regex constructability (case-insensitive flag applied).
 * Separate from compileOptionalRegex because callers may want a pure predicate
 * instead of a compiled instance / undefined tri-state.
 */
export function isValidRegex(value: string): boolean {
  try {
    new RegExp(value, "i");
    return true;
  } catch {
    return false;
  }
}
