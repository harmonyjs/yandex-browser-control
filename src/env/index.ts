/**
 * Entry-point: defines concrete env vars, keeps reports.
 * Side-effect: maintains an in-memory report registry for this module.
 */
import { env, createReport, type EnvReport, type EnvState } from "./pipeline.js";
import { normalize } from "../utils/string.js";
import { isLogLevel } from "../logger/constants.js";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------
export const DEFAULT_APP_ID = "ru.yandex.desktop.yandex-browser";

// ----------------------------------------------------------------------------
/** Report registry (controlled side-effect within this module). */
let reports: EnvReport[] = [];

const collectReport = (state: EnvState<unknown>): void => {
  reports.push(createReport(state));
};

/** Read-only snapshot of collected reports. */
export const getEnvReports = (): ReadonlyArray<EnvReport> => reports.slice();

/** Clear reports (useful for tests or re-inits). */
export const resetEnvReports = (): void => {
  reports = [];
};

// ----------------------------------------------------------------------------
// Concrete env vars
// ----------------------------------------------------------------------------

export const APP_ID = env("APP_ID", process.env.APP_ID)
  .default(DEFAULT_APP_ID)
  .transform(normalize)
  .tap(collectReport)
  .value();

export const LOG_LEVEL = env("LOG_LEVEL", process.env.LOG_LEVEL)
  .default("info")
  .transform(normalize)
  .validate(isLogLevel, (v) => `Invalid log level: ${v}`)
  .tap(collectReport)
  .value();

/**
 * Examples for future:
 *
 * // number PORT:
 * // import { isPort } from "./validators";
 * // export const PORT = env("PORT", process.env.PORT)
 * //   .transform(normalize)
 * //   .map((s) => {
 * //     const n = Number.parseInt(s, 10);
 * //     return Number.isInteger(n) ? n : undefined;
 * //   })
 * //   .default(3000)
 * //   .validate(isPort, (n) => `Port 1..65535, got: ${n}`)
 * //   .tap(collectReport)
 * //   .value();
 */
