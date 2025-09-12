import type { WindowMeta } from "../../models/window-meta.js";
import { formatCountHeader } from "../shared/headers.js";

export function formatWindowLine(w: WindowMeta): string {
  const [x, y, width, height] = w.bounds;
  const stateTokens: string[] = [];
  stateTokens.push(w.visible ? 'visible' : 'hidden');
  if (w.minimized) stateTokens.push('minimized');
  if (w.zoomed) stateTokens.push('zoomed');
  const state = stateTokens.join(' ');
  return `• [windowId=${w.windowId}] index=${w.index} mode=${w.mode} bounds={${x}, ${y}, ${width}, ${height}} state=${state}`;
}

export function formatList(rows: WindowMeta[]): string {
  if (rows.length === 0) return 'No windows found matching the criteria.';
  const header: string = formatCountHeader({ count: rows.length, singular: "window" });
  const body = rows.map(formatWindowLine).join('\n');
  return `${header}\n\n${body}`;
}
