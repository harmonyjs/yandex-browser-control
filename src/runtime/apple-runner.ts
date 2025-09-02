import { createAppleRunner } from "@avavilov/apple-script";

// Yandex Browser bundle identifier
export const APP_ID = "ru.yandex.desktop.yandex-browser" as const;

// Shared AppleScript runner for all tools
export const apple = createAppleRunner({
  appId: APP_ID,
  ensureAppReady: true,
  validateByDefault: true,
});

export type AppleRunner = typeof apple;
