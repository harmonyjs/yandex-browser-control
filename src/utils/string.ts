/** String helpers used as transforms/mappers across the project. */

/** Trim; empty -> undefined (to trigger default fallback) */
export const normalize = (s: string): string | undefined => {
  const t = s.trim();
  return t.length > 0 ? t : undefined;
};

export const toLowerCase = (s: string): string => s.toLowerCase();
export const toUpperCase = (s: string): string => s.toUpperCase();
