import type {
  CallToolResult,
  ToolAnnotations,
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

// Minimal, unified contract for tool modules without tight type coupling.
// When a tool has parameters, provide `inputSchema` (Zod raw shape) and a handler that
// receives (args, extra). For parameterless tools, omit `inputSchema` and provide a handler
// that receives only (extra).
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
 * after validating against the provided Zod raw shape (inputSchema).
 *
 * Notes:
 * - inputSchema should be a Zod raw shape (i.e., a map of field: zodType) — we keep it typed as
 *   Record<string, unknown> here to avoid coupling to a specific Zod instance.
 * - Handlers are always async for simplicity and consistency.
 */
export type ToolModuleWithArgs<Args = unknown> = ToolModuleBase & {
  inputSchema: Record<string, unknown>;
  /**
   * Handler receives:
   * - args: parsed arguments validated against `inputSchema` by the SDK.
   * - extra: typed context object (ToolExtra) provided by the SDK for the current call.
   */
  handler: (args: Args, extra: ToolExtra) => Promise<CallToolResult>;
};

/**
 * Tool module without parameters.
 */
export type ToolModuleNoArgs = ToolModuleBase & {
  // Explicitly no input schema
  inputSchema?: undefined;
  /**
   * Handler receives only the SDK-provided `extra` context (see docs above).
   */
  handler: (extra: ToolExtra) => Promise<CallToolResult>;
};

/**
 * Union of tool module variants. Presence of inputSchema discriminates the handler signature.
 */
export type ToolModule<Args = unknown> =
  | ToolModuleNoArgs
  | ToolModuleWithArgs<Args>;
