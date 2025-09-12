import type { WindowMeta } from "../../models/window-meta.js";
import { LARGE_RESULT_THRESHOLD } from "../../utils/constants.js";

export function formatHeader(total: number): string {
  let header = `Found ${total} window${total === 1 ? '' : 's'}`;
  if (total > LARGE_RESULT_THRESHOLD) {
    header = `WARNING: Large result set (${total} windows) – consider refining filters.\n\n` + header;
  }
  return header;
}

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
  const header = formatHeader(rows.length);
  const body = rows.map(formatWindowLine).join('\n');
  return `${header}\n\n${body}`;
}
