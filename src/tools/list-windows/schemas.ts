/**
 * @fileoverview Schemas (orderBy + args) for the list_windows tool.
 *
 * orderBy keys:
 *  - windowId  : numeric ascending
 *  - index     : numeric ascending (creation / Z-order sequence)
 *  - mode      : window mode ordering (normal < incognito)
 *  - visible   : false before true
 *  - minimized : false before true
 *  - zoomed    : false before true
 *
 * The enumeration is intentionally local (YAGNI) until another tool needs reuse.
 */
import { z } from "zod";

/** Literal tuple of ordering keys supported by list_windows. */
export const orderByValues = [
  "windowId",
  "index",
  "mode",
  "visible",
  "minimized",
  "zoomed",
] as const;
/** Zod schema for ordering key enumeration. */
export const orderBySchema = z.enum(orderByValues);
/** TS union of ordering keys. */
export type OrderBy = z.infer<typeof orderBySchema>;

// (argsSchema intentionally kept in index.ts to mirror list_tabs structure.)
