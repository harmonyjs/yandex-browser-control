import type { WindowMeta } from "../../models/window-meta.js";
import type { OrderBy } from "./schemas.js";

const MODE_UNKNOWN_RANK = 2; // Align with index.ts constant (kept here after extraction)

const modeRank = (m: string): number => (m === "normal" ? 0 : m === "incognito" ? 1 : MODE_UNKNOWN_RANK);

/**
 * Returns a new sorted copy; stable fallback uses windowId then index.
 */
export function sortWindows(rows: WindowMeta[], orderBy: OrderBy | undefined): WindowMeta[] {
  if (orderBy === undefined) return rows;
  const sorted = rows.slice();
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (orderBy) {
      case "windowId":
        cmp = a.windowId - b.windowId;
        break;
      case "index":
        cmp = a.index - b.index;
        break;
      case "mode":
        cmp = modeRank(a.mode) - modeRank(b.mode);
        break;
      case "visible":
        cmp = Number(a.visible) - Number(b.visible);
        break;
      case "minimized":
        cmp = Number(a.minimized) - Number(b.minimized);
        break;
      case "zoomed":
        cmp = Number(a.zoomed) - Number(b.zoomed);
        break;
    }
    if (cmp !== 0) return cmp;
    if (a.windowId !== b.windowId) return a.windowId - b.windowId;
    return a.index - b.index;
  });
  return sorted;
}
