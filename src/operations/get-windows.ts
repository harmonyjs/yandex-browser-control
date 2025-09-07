/**
 * @fileoverview Operation: get-windows
 *
 * Return a snapshot of all browser windows as WindowMeta[].
 * Pure READ – no side effects. AppleScript only queries state.
 */

import { z } from "zod";
import { operation } from "@avavilov/apple-script";
import { emptySchema } from "../models/common/empty.js";
import { windowMetaSchema } from "../models/window-meta.js";

// Parse bounds returned as a string like "{x, y, w, h}" or "x,y,w,h" into a numeric tuple
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Tuple size is a fixed contract [x,y,width,height]
const BOUNDS_TUPLE_LENGTH = 4 as const;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Decimal radix for Number.parseInt
const RADIX_DECIMAL = 10 as const;

function parseBoundsString(input: unknown): [number, number, number, number] {
  const s = String(input);
  const matches = s.match(/-?\d+/g) ?? [];
  if (matches.length < BOUNDS_TUPLE_LENGTH) throw new Error(`Invalid bounds string: ${s}`);
  const nums = matches.slice(0, BOUNDS_TUPLE_LENGTH).map((v) => Number.parseInt(v, RADIX_DECIMAL));
  if (nums.some((n) => Number.isNaN(n))) throw new Error(`Invalid bounds numbers: ${s}`);
  const [x, y, width, height] = nums as [number, number, number, number];
  return [x, y, width, height];
}

function normalizeBounds(input: unknown): [number, number, number, number] {
  if (typeof input === "string") return parseBoundsString(input);
  if (!Array.isArray(input)) return [0, 0, 0, 0];
  const arr = input as ReadonlyArray<unknown>;
  const coerce = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
    if (typeof v === "string") {
      const m = v.match(/-?\d+/);
      if (m) return Number.parseInt(m[0], RADIX_DECIMAL);
      const n = Number(v);
      if (Number.isFinite(n)) return Math.trunc(n);
    }
    return 0;
  };
  const x = coerce(arr[0]);
  const y = coerce(arr[1]);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Fixed tuple layout
  const w = coerce(arr[2]);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Fixed tuple layout
  const h = coerce(arr[3]);
  return [x, y, w, h];
}

// Row-level schema: preprocess AppleScript quirks, then validate using WindowMeta schema
const getWindowsRowSchema: z.ZodType<z.infer<typeof windowMetaSchema>> = z
  .any()
  .transform((row) => {
    const obj = row as Record<string, unknown>;
    const [bx, by, bw, bh] = normalizeBounds(obj.bounds);
    return windowMetaSchema.parse({
      windowId: obj.windowId,
      index: obj.index,
      mode: obj.mode,
      bounds: [bx, by, bw, bh],
      visible: obj.visible,
      minimized: obj.minimized,
      zoomed: obj.zoomed,
    });
  });

// AppleScript body as a constant to keep the script() function small per lint rules
const GET_WINDOWS_APPLESCRIPT = `
    -- Build rows: { {windowId, index, mode, bounds[x,y,w,h], visible, minimized, zoomed}, ... }
    set rows to {}
    set winList to {}
    try
      set winList to windows
    on error
      set winList to {}
    end try
    if (count of winList) > 0 then
      repeat with w in winList
        set winId to ""
        try
          set winId to id of w
        end try

        set winIndex to ""
        try
          set winIndex to index of w
        end try

        -- Mode: prefer 'mode of w' if available; fallback to "normal"
        set modeText to "normal"
        try
          set modeText to (mode of w) as text
        end try

        -- Bounds: convert {left, top, right, bottom} → {x, y, width, height}
        set boundsTuple to {0, 0, 0, 0}
        try
          set rect to bounds of w
          if (count of rect) is 4 then
            set leftPos to item 1 of rect
            set topPos to item 2 of rect
            set rightPos to item 3 of rect
            set bottomPos to item 4 of rect
            set widthVal to (rightPos - leftPos)
            set heightVal to (bottomPos - topPos)
            set boundsTuple to {leftPos, topPos, widthVal, heightVal}
          end if
        end try

        -- Visible flag (best-effort)
        set vis to true
        try
          set vis to visible of w
        end try

        -- Minimized flag: try 'minimized', fallback to 'miniaturized'
        set mini to false
        try
          set mini to minimized of w
        on error
          try
            set mini to miniaturized of w
          end try
        end try

        -- Zoomed flag (may not exist for some apps)
        set zoomFlag to false
        try
          set zoomFlag to zoomed of w
        end try

        if (winId is not "" and winIndex is not "") then
          set end of rows to {winId, winIndex, modeText, boundsTuple, vis, mini, zoomFlag}
        end if
      end repeat
    end if
    return rows
`;

/**
 * Input schema for `get-windows` operation: explicit empty object.
 */
export const getWindowsInputSchema = emptySchema;
export type GetWindowsInput = z.infer<typeof getWindowsInputSchema>;

/**
 * Output schema for `get-windows` operation: array of WindowMeta rows.
 */
export const getWindowsOutputSchema = z.array(getWindowsRowSchema);
export type GetWindowsOutput = z.infer<typeof getWindowsOutputSchema>;
export type GetWindowsRow = z.infer<typeof windowMetaSchema>;

/**
 * Return a snapshot of all browser windows.
 * Columns MUST match WindowMeta key order: windowId, index, mode, bounds, visible, minimized, zoomed
 */
export const getWindowsOperation = operation.rows({
  name: "get-windows",
  input: getWindowsInputSchema,
  output: getWindowsOutputSchema,
  // Columns define mapping order from AppleScript row arrays → object keys
  columns: ["windowId", "index", "mode", "bounds", "visible", "minimized", "zoomed"],
  script: () => GET_WINDOWS_APPLESCRIPT,
});
