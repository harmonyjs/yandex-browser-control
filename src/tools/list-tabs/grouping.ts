/**
 * @fileoverview Grouping & sorting logic for list_tabs.
 *
 * Responsibilities:
 *  - Derive group buckets (window | host | mode | none)
 *  - Stable in-group ordering (optional orderBy)
 *  - Deterministic group ordering
 *
 * Ordering rules:
 *  - window: numeric ascending
 *  - host / none: case-insensitive lexical
 *  - mode: normal < incognito < others ("unknown")
 *
 * Implementation notes:
 *  - Absent window metadata ⇒ mode bucket becomes "unknown" (kept explicit for clarity)
 *  - Mode in-group ordering falls back to windowId (no per-tab mode field)
 */

import type { WindowMeta } from "../../models/window-meta.js";
import type { GroupKey, OrderBy } from "./schemas.js";
import type { TabWithHost } from "./types.js";
import { compare } from "./utils.js";

export function groupTabs(
  tabs: TabWithHost[],
  groupBy: GroupKey,
  windowModeMap?: Map<number, WindowMeta>
): Map<string, TabWithHost[]> {
  const groups = new Map<string, TabWithHost[]>();

  for (const tab of tabs) {
    let groupKey: string;
    switch (groupBy) {
      case "window":
        groupKey = String(tab.windowId);
        break;
      case "host":
        groupKey = tab.host;
        break;
      case "mode":
        if (windowModeMap) {
          const window = windowModeMap.get(tab.windowId);
          groupKey = window ? window.mode : "unknown";
        } else {
          groupKey = "unknown";
        }
        break;
      case "none":
      default:
        groupKey = "all";
        break;
    }

    const group = groups.get(groupKey) || [];
    group.push(tab);
    groups.set(groupKey, group);
  }

  return groups;
}

export function sortGroups(
  groups: Map<string, TabWithHost[]>,
  groupBy: GroupKey,
  orderBy?: OrderBy
): Array<[string, TabWithHost[]]> {
  // Sort tabs within each group
  if (orderBy !== undefined) {
    for (const [key, tabs] of groups) {
      tabs.sort((a, b) => compareTabsByField(a, b, orderBy));
      groups.set(key, tabs);
    }
  }

  // Sort groups by their keys
  const entries = Array.from(groups.entries());
  entries.sort((a, b) => {
    const [keyA] = a;
    const [keyB] = b;

    switch (groupBy) {
      case "window":
        return compare.number(Number(keyA), Number(keyB));
      case "mode":
        // normal < incognito
        if (keyA === "normal" && keyB === "incognito") return -1;
        if (keyA === "incognito" && keyB === "normal") return 1;
        return compare.stringCI(keyA, keyB);
      case "host":
      case "none":
      default:
        return compare.stringCI(keyA, keyB);
    }
  });

  return entries;
}

function compareTabsByField(a: TabWithHost, b: TabWithHost, field: OrderBy): number {
  switch (field) {
    case "title":
      return compare.stringCI(a.title, b.title);
    case "url":
      return compare.stringCI(a.url, b.url);
    case "host":
      return compare.stringCI(a.host, b.host);
    case "windowId":
      return compare.number(a.windowId, b.windowId);
    case "tabId":
      return compare.number(a.tabId, b.tabId);
    case "loading":
      return compare.boolean(a.loading, b.loading);
    case "mode":
      // Can't sort by mode within a tab without window data
      // Fallback to stable sort by windowId
      return compare.number(a.windowId, b.windowId);
    default:
      return 0;
  }
}