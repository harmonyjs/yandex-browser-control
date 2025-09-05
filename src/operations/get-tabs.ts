/**
 * @fileoverview Operation: get-tabs
 * 
 * Return a snapshot of all browser tabs (across all windows) as TabRaw[].
 * Pure READ – no side effects. AppleScript only queries state.
 */

import { z } from "zod";
import { operation } from "@avavilov/apple-script";
import { emptySchema } from "../models/common/empty.js";
import { tabRawSchema } from "../models/tab-raw.js";

/**
 * Input schema for `get-tabs` operation.
 */
export const getTabsInputSchema = emptySchema;
export type GetTabsInput = z.infer<typeof getTabsInputSchema>;

/**
 * Output schema for `get-tabs` operation.
 */
export const getTabsOutputSchema = z.array(tabRawSchema);
export type GetTabsOutput = z.infer<typeof getTabsOutputSchema>;

/**
 * Return a snapshot of all browser tabs (across all windows).
 */
export const getTabsOperation = operation.rows({
  name: "get-tabs",
  input: getTabsInputSchema,
  output: getTabsOutputSchema,
  // Columns define mapping order from AppleScript row arrays → object keys
  columns: ["windowId", "tabId", "title", "url", "loading"],
  script: () => `
    -- Build rows: { {windowId, tabId, title, url, loading}, ... }
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
        set tabList to {}
        try
          set tabList to tabs of w
        end try
        if (count of tabList) > 0 then
          repeat with t in tabList
            set tId to ""
            try
              set tId to id of t
            end try
            set tTitle to ""
            try
              set tTitle to title of t
            end try
            set tUrl to ""
            try
              set tUrl to URL of t
            end try
            set tLoading to false
            try
              set tLoading to loading of t
            end try
            if (winId is not "" and tId is not "") then
              set end of rows to {winId, tId, tTitle, tUrl, tLoading}
            end if
          end repeat
        end if
      end repeat
    end if
    return rows
  `,
});
