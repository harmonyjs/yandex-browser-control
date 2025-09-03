import { createAppleRunner } from "@avavilov/apple-script";
import { logger } from "./logger.js";
import { APP_ID } from "../env/index.js";

// Yandex Browser bundle identifier (configurable via env; see src/env/index.ts)

const log = logger.child({ scope: "apple-runner" });
log.info({ appId: APP_ID }, "using application bundle id");

// Shared AppleScript runner for all tools
export const apple = createAppleRunner({
  appId: APP_ID,
  ensureAppReady: true,
  validateByDefault: true,
});

export type AppleRunner = typeof apple;
