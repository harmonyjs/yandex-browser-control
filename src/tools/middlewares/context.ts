/**
 * @fileoverview Unified context for tool middleware pipeline.
 * 
 * All middlewares receive the same context object containing:
 * - mod: The tool module definition (for access to name, schema, etc.)
 * - args: The raw arguments passed to the tool
 * - extra: The MCP SDK context (signal, requestId, etc.)
 */
import type { ToolModule, ToolExtra } from "../types.js";

/**
 * Context object passed through the middleware pipeline.
 */
export interface ToolContext {
  /** The tool module being executed */
  mod: ToolModule;
  /** Raw arguments passed to the tool (undefined for parameterless tools) */
  args: unknown;
  /** MCP SDK context (signal, requestId, etc.) */
  extra: ToolExtra;
}

/**
 * Middleware function type that operates on the tool context.
 * Returns a Runner that executes the next middleware or handler.
 */
export type ToolMiddleware<T> = (ctx: ToolContext) => (next: () => Promise<T>) => () => Promise<T>;