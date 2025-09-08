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

/**
 * Input schema for `get-windows` operation: explicit empty object.
 */
export const getWindowsInputSchema = emptySchema;
export type GetWindowsInput = z.infer<typeof getWindowsInputSchema>;

/**
 * Output schema for `get-windows` operation: array of WindowMeta rows.
 */
export const getWindowsOutputSchema = z.array(windowMetaSchema);
export type GetWindowsOutput = z.infer<typeof getWindowsOutputSchema>;

/**
 * Return a snapshot of all browser windows.
 * Columns MUST match WindowMeta key order: windowId, index, mode, bounds, visible, minimized, zoomed
 */
export const getWindowsOperation = operation.rows({
  name: "get-windows",
  input: getWindowsInputSchema,
  output: getWindowsOutputSchema,
  // Columns define mapping order from AppleScript row arrays → object keys
  columns: [
    "windowId",
    "index",
    "mode",
    "bounds",
    "visible",
    "minimized",
    "zoomed",
  ],
  // This inlined AppleScript listing is intentionally long. Splitting it would hurt readability
  // and maintainability of the script itself. We disable the rule locally for this single function.
  // eslint-disable-next-line max-lines-per-function
  script: () => `
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

        -- Bounds: convert {left, top, right, bottom} → text "{x, y, width, height}"
        set boundsText to "{0, 0, 0, 0}"
        try
          set rect to bounds of w
          if (count of rect) is 4 then
            set leftPos to item 1 of rect
            set topPos to item 2 of rect
            set rightPos to item 3 of rect
            set bottomPos to item 4 of rect
            set widthVal to (rightPos - leftPos)
            set heightVal to (bottomPos - topPos)
            set boundsText to "{" & leftPos & ", " & topPos & ", " & widthVal & ", " & heightVal & "}"
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
          set end of rows to {winId, winIndex, modeText, boundsText, vis, mini, zoomFlag}
        end if
      end repeat
    end if
    return rows
  `,
});
