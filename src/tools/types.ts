/**
 * @fileoverview Unified ToolModule contract & helpers.
 *
 * Goals:
 *  - Single handler shape (args, extra) for every tool (no dual overload drift).
 *  - Decouple local Zod usage; pipeline (register-tool) extracts raw shape.
 *  - Centralize type utilities (ToolArgs) for consumer inference.
 *
 * See tools/README.md for architectural rationale & middleware stack.
 */
import type {
  CallToolResult,
  ToolAnnotations,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { z } from "zod";

// All tools supply an argsSchema (z.object({}) for no-arg tools) + unified handler.
/**
 * Common metadata shared by all tool modules.
 */
export type ToolModuleBase = {
  name: string;
  description?: string;
  annotations?: ToolAnnotations;
};

/**
 * The SDK-provided context object passed to request/tool handlers.
 * Strongly typed so tool authors get IntelliSense for fields like `signal`.
 */
export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/**
 * Tool module with parameters.
 *
 * Generic Args represents the parsed arguments object that the SDK will pass to the handler
 * after validating against the provided Zod schema.
 *
 * Notes:
 * - Handlers are always async for simplicity and consistency.
 * - Input validation is centralized via middleware using `argsSchema`.
 */
// ===== Unified form (always takes args object) =====

export interface ToolModule extends ToolModuleBase {
  argsSchema: z.ZodType<unknown>; // runtime schema; unknown keeps boundary narrow
  handler: (args: unknown, extra: ToolExtra) => Promise<CallToolResult>;
}

/**
 * Factory for creating a ToolModule. Always requires an `argsSchema`. For tools
 * without arguments, pass `z.object({})` and write a handler that ignores its args.
 */
export function defineTool<Args>(spec: {
  name: string;
  description?: string;
  annotations?: ToolAnnotations;
  argsSchema: z.ZodType<Args>;
  handler: ((args: Args, extra: ToolExtra) => Promise<CallToolResult>) | ((args: never, extra: ToolExtra) => Promise<CallToolResult>);
}): ToolModule {
  const { handler, argsSchema, ...metadata } = spec;

  const unifiedHandler = handler as (args: unknown, extra: ToolExtra) => Promise<CallToolResult>;
  return { ...metadata, argsSchema, handler: unifiedHandler };
}

/** Convenience empty schema factory (avoid shared mutable identity). */
export const emptyInput = () => ({}) as const;

/** Extract argument type from a ToolModule (utility). */
export type ToolArgs<T extends ToolModule> = T['argsSchema'] extends z.ZodType<infer U> ? U : never;

