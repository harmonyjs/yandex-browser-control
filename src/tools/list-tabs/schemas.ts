/**
 * @fileoverview Enum schemas (groupBy / orderBy) for the list_tabs tool.
 *
 * groupBy:
 *  - none   : single collection (no headers)
 *  - window : by windowId
 *  - host   : normalized host (see safeHost())
 *  - mode   : window mode (joins get-windows; unknown if missing)
 *
 * orderBy (tab-level sort within each group):
 *  title | url | host | windowId | tabId | mode | loading
 *  - mode: fallback sorting (windowId) if per-tab mode unavailable
 *  - loading: false < true (stable among equals)
 *
 * Local-only (YAGNI). Promote only after ≥2 tools need reuse.
 */
import { z } from "zod";
export const groupKeyValues = ["none", "window", "host", "mode"] as const;
/** Zod schema for the grouping key enumeration. */
export const groupKeySchema = z.enum(groupKeyValues);
/** TypeScript inferred grouping key union. */
export type GroupKey = z.infer<typeof groupKeySchema>;

/**
 * Ordering key enumeration for sorting individual tabs (and optionally
 * for deriving group ordering logic where relevant). Only fields derivable
 * within the Tools layer are included— no operation shape changes.
 *
 * "title"    – lexical compare of tab title (case-insensitive)
 * "url"      – lexical compare of raw url
 * "host"     – lexical compare of normalized host (derived from url)
 * "windowId" – numeric ascending
 * "tabId"    – numeric ascending
 * "mode"     – window mode ordering: normal < incognito (join required)
 * "loading"  – false before true (stable among equals via windowId+tabId)
 */
/**
 * Literal tuple of supported ordering keys.
 */
export const orderByValues = ["title", "url", "host", "windowId", "tabId", "mode", "loading"] as const;
/** Zod schema for ordering key enumeration. */
export const orderBySchema = z.enum(orderByValues);
/** TypeScript inferred ordering key union. */
export type OrderBy = z.infer<typeof orderBySchema>;
