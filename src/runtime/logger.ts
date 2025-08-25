// Centralized Pino logger configured for MCP over stdio
// - All logs are written to stderr (never stdout)
// - Additionally, logs are duplicated into a temp file
// - On init, the absolute path to the temp log file is printed to stderr

import {
  pino,
  multistream,
  destination,
  type LoggerOptions,
  type DestinationStream,
} from "pino";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Small helper to write a single line to stderr (never stdout)
const printToStderr = (line: string): void => {
  process.stderr.write(`${line}\n`);
};

// Build log file path inside the OS temp directory
const LOG_FILE_BASENAME = "yandex-browser-control.log";
const timestamp = Date.now();
export const logFilePath = join(
  tmpdir(),
  `${LOG_FILE_BASENAME}.${process.pid}.${timestamp}`,
);

// Create destinations: async file and stderr
const fileDestination: DestinationStream = destination({
  dest: logFilePath,
  append: true,
  sync: false,
});

// Pino configuration: log to our multistream, level defaults to info
const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

export const logger = pino(
  options,
  multistream([{ stream: process.stderr }, { stream: fileDestination }]),
);

// Announce the log file path to stderr so users know where to find logs
printToStderr(`logging to file: ${logFilePath}`);

// Helpful hint: pretty-print the JSON logs locally (stderr tip only; stdout is reserved for MCP)
printToStderr(
  `you can pretty print logs via 'npx -y pino-pretty@12.1.0 < ${logFilePath}'`,
);

// emit a structured log that logger is ready (goes to stderr and file)
logger.info("logger initialized");

// Utility to flush logs on shutdown when desired
export const flushLogs = async (): Promise<void> => {
  // DestinationStream is typically SonicBoom; flush if supported without unsafe casting
  type Flushable = { flush?: () => void; flushSync?: () => void };
  const isFlushable = (s: unknown): s is Flushable =>
    typeof s === "object" && s !== null && ("flush" in s || "flushSync" in s);

  try {
    if (isFlushable(fileDestination)) {
      if (typeof fileDestination.flush === "function") fileDestination.flush();
      else if (typeof fileDestination.flushSync === "function")
        fileDestination.flushSync();
    }
  } catch {
    // Ignore flush errors during shutdown
  }
  await Promise.resolve();
};
