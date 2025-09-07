import test from "node:test";
import assert from "node:assert/strict";
import {
  isSuccess,
  getUserFriendlyMessage,
  isAppleScriptError,
  isTimeoutError,
  OutputValidationError,
  InputValidationError,
  InvalidReturnTypeError,
  ParseError,
} from "@avavilov/apple-script";
import { apple } from "../runtime/apple-runner.js";
import { getWindowsOperation } from "./get-windows.js";

// Classify run error into fail-or-skip with a message
function classifyRunError(error: unknown): { mode: "fail" | "skip"; message: string } {
  // error is OperationError; get user-friendly string first
  const message = getUserFriendlyMessage(error);
  const cause = (error as { cause?: unknown } | undefined)?.cause;

  const isProtocolValidation =
    isAppleScriptError(cause) &&
    (cause instanceof OutputValidationError ||
      cause instanceof InputValidationError ||
      cause instanceof InvalidReturnTypeError ||
      cause instanceof ParseError);

  if (isProtocolValidation) return { mode: "fail", message: `Operation schema/protocol error: ${message}` };
  if (isTimeoutError(cause)) return { mode: "skip", message: `Yandex Browser timeout: ${message}` };
  if (isAppleScriptError(cause)) return { mode: "skip", message: `Yandex Browser not available or script error: ${message}` };
  return { mode: "skip", message: `Yandex Browser unavailable: ${message}` };
}

void test("get-windows returns valid WindowMeta[] shape", { timeout: 30_000 }, async (t) => {
  const result = await apple.run(getWindowsOperation, {});

  if (!isSuccess(result)) {
    const { mode, message } = classifyRunError(result.error);
    if (mode === "fail") assert.fail(message);
    t.skip(message);
    return;
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
