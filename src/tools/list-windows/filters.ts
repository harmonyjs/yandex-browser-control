import type { WindowMeta } from "../../models/window-meta.js";
import type { Args } from "./index.js";

/**
 * Filter windows array by windowId (number|number[]) and mode.
 * Pure function – no mutation of inputs.
 */
export function filterWindows(rows: WindowMeta[], args: Args): WindowMeta[] {
  let result = rows;
  if (Object.prototype.hasOwnProperty.call(args, "windowId") && args.windowId !== undefined) {
    if (Array.isArray(args.windowId)) {
      const set = new Set<number>(args.windowId);
      result = result.filter((w) => set.has(w.windowId));
    } else {
      result = result.filter((w) => w.windowId === args.windowId);
    }
  }
  if (Object.prototype.hasOwnProperty.call(args, "mode") && args.mode !== undefined) {
    const mode = args.mode;
    result = result.filter((w) => w.mode === mode);
  }
  return result;
}
