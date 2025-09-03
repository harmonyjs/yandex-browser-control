// Side-effect-free logger constants and helpers
// Allowed dependency: pino (to read canonical level names and type)
import pino, { type Level } from "pino";

// Source of truth for pino levels (9.x): trace, debug, info, warn, error, fatal
// No custom extensions like 'silent'
export const LOG_LEVELS = Object.keys(pino.levels.values) as ReadonlyArray<Level>;

export type LogLevel = Level;

/** Check against pino's known levels without instantiating a logger. */
export const isLogLevel = (v: string): v is LogLevel =>
  Object.prototype.hasOwnProperty.call(pino.levels.values, v);
