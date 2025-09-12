import test from "node:test";
import assert from "node:assert/strict";
import { isSuccess, getUserFriendlyMessage, isAppleScriptError, isTimeoutError } from "@avavilov/apple-script";
import { apple } from "../runtime/apple-runner.js";
import { getWindowsOperation } from "./get-windows.js";

// Error handling policy: ANY error is a test failure (no skips)
function formatRunError(error: unknown): string {
  const message = getUserFriendlyMessage(error);
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  if (isTimeoutError(cause)) return `Timeout executing get-windows: ${message}`;
  if (isAppleScriptError(cause)) return `AppleScript error executing get-windows: ${message}`;
  return `Unexpected error executing get-windows: ${message}`;
}

void test("[int] get-windows returns valid WindowMeta[] shape", { timeout: 30_000 }, async () => {
  const result = await apple.run(getWindowsOperation, {});

  if (!isSuccess(result)) {
    assert.fail(formatRunError(result.error));
  }

  // Result is already validated by the runner (validateByDefault: true)
  const rows = result.data;

  // Spot-check a few rows
  for (const row of rows.slice(0, 3)) {
    assert.ok(Number.isInteger(row.windowId) && row.windowId >= 0, "windowId is non-negative int");
    assert.ok(Number.isInteger(row.index) && row.index >= 0, "index is non-negative int");
    assert.ok(row.mode === "normal" || row.mode === "incognito", "mode is normal|incognito");
    assert.ok(Array.isArray(row.bounds) && row.bounds.length === 4, "bounds is [x,y,width,height]");
    assert.equal(typeof row.visible, "boolean", "visible is boolean");
    assert.equal(typeof row.minimized, "boolean", "minimized is boolean");
    assert.equal(typeof row.zoomed, "boolean", "zoomed is boolean");
  }
});
