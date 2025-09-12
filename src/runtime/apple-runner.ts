/**
 * @fileoverview Central AppleScript runner configuration.
 *
 * Purpose:
 *  - Single source of timeout policy (AppleScript + controller) so callers avoid per‑run overrides.
 *  - Keeps layers in sync (prevents script finishing while controller still waits, or vice versa).
 *
 * Environment:
 *  - APP_ID: target application bundle id (default: ru.yandex.desktop.yandex-browser)
 *  - APPLE_RUNNER_TIMEOUT_MS: unified ms timeout ⇒ converted to seconds for AppleScript layer.
 *
 * Precedence (library): run override > timeoutByKind > defaultTimeoutSec > library fallback.
 * We only set defaultTimeoutSec + defaultControllerTimeoutMs ensuring identical budget.
 *
 * Rationale:
 *  - Eliminate scattered magic numbers.
 *  - Centralize rounding (ceil) so AppleScript never times out before the controller.
 */
import { createAppleRunner } from "@avavilov/apple-script";
import { logger } from "../logger/index.js";
import { APP_ID, APPLE_RUNNER_TIMEOUT_MS } from "../env/index.js";
import { MILLIS_IN_SECOND } from "../utils/constants.js";

// Yandex Browser bundle identifier (configurable via env; see src/env/index.ts)

const log = logger.child({ scope: "apple-runner" });
log.info({ appId: APP_ID }, "using application bundle id");

// Derive AppleScript timeout seconds (ceil so script layer is never shorter).
const defaultTimeoutSec = Math.ceil(APPLE_RUNNER_TIMEOUT_MS / MILLIS_IN_SECOND);

export const apple = createAppleRunner({
  appId: APP_ID,
  ensureAppReady: true,
  validateByDefault: true,
  defaultTimeoutSec,
  defaultControllerTimeoutMs: APPLE_RUNNER_TIMEOUT_MS,
});

export type AppleRunner = typeof apple;
