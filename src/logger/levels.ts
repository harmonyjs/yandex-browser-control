import pino, { type Level } from "pino";

/** Union for env: any pino Level or silent */
export type LogLevel = Level | "silent";

/** Check against pino's known levels without instantiating a logger. */
export const isLogLevel = (v: string): v is LogLevel =>
  v === "silent" || Object.prototype.hasOwnProperty.call(pino.levels.values, v);
