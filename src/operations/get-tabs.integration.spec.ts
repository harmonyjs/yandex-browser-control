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
import { getTabsOperation } from "./get-tabs.js";

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

void test("get-tabs returns valid TabRaw[] shape", { timeout: 30_000 }, async (t) => {
  const result = await apple.run(getTabsOperation, {});

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
    assert.ok(Number.isInteger(row.tabId) && row.tabId >= 0, "tabId is non-negative int");
    assert.equal(typeof row.title, "string", "title is string");
    assert.equal(typeof row.url, "string", "url is string");
    assert.equal(typeof row.loading, "boolean", "loading is boolean");
  }
});
