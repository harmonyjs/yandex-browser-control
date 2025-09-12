import test from "node:test";
import assert from "node:assert/strict";
import { isSuccess, getUserFriendlyMessage, isAppleScriptError, isTimeoutError } from "@avavilov/apple-script";
import { apple } from "../runtime/apple-runner.js";
import { getTabsOperation } from "./get-tabs.js";

// Error handling policy: ANY error is a test failure (no skips)
function formatRunError(error: unknown): string {
  const message = getUserFriendlyMessage(error);
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  if (isTimeoutError(cause)) return `Timeout executing get-tabs: ${message}`;
  if (isAppleScriptError(cause)) return `AppleScript error executing get-tabs: ${message}`;
  return `Unexpected error executing get-tabs: ${message}`;
}

void test("[int] get-tabs returns valid TabRaw[] shape", { timeout: 60_000 }, async () => {
  const result = await apple.run(getTabsOperation, {});

  if (!isSuccess(result)) {
    assert.fail(formatRunError(result.error));
  }

  // Result is already validated by the runner (validateByDefault: true)
  const rows = result.data;

  // Spot-check a few rows
  for (const row of rows.slice(0, 3)) {
    assert.ok(Number.isInteger(row.windowId) && row.windowId >= 0, "windowId is non-negative int");
    assert.ok(Number.isInteger(row.tabId) && row.tabId >= 0, "tabId is non-negative int");
    assert.equal(typeof row.title, "string", "title is string");
    assert.equal(typeof row.url, "string", "url is string");
    assert.equal(typeof row.loading, "boolean", "loading is boolean");
  }
});
