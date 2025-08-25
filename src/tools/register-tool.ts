/**
 * Centralized registration helper for ToolModule.
 *
 * Why this file exists:
 * - The MCP SDK exposes `server.registerTool(...)` with several overloads that depend on
 *   whether a tool has parameters (inputSchema) or not. Tools without params use a handler
 *   signature `(extra) => ...`, while tools with params use `(args, extra) => ...`.
 * - Our ToolModule type is intentionally decoupled from the SDK’s internal Zod types to avoid
 *   coupling every tool to a specific Zod instance/version bundled inside the SDK.
 * - Because of that decoupling, there is a small type gap at the single call site where we
 *   pass `inputSchema` into `server.registerTool`. We bridge that with one narrowly-scoped
 *   `as any` cast below, so individual tools stay clean and strongly-typed locally.
 *
 * Important: This cast does NOT hide runtime problems. The SDK still validates inputs at
 * runtime using its own Zod; invalid schemas or arguments will fail during the call, as
 * expected. The cast here only resolves a compile-time nominal-typing mismatch between the
 * SDK’s internal Zod and the workspace types.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolExtra, ToolModule } from "./types.js";
import { chain, type Runner } from "../utils/middleware/index.js";
import { withAbort } from "./middlewares/abort.js";
import { withLogging } from "./middlewares/logging.js";

/**
 * Single entry point to execute a handler through the wrapper pipeline.
 */
function runThrough<T>(name: string, extra: ToolExtra, leaf: Runner<T>): Promise<T> {
  const runner = chain<T>(
    // Order matters: topmost wraps below ones
    withLogging<T>(name, extra),
    withAbort<T>(name, extra)
  )(leaf);
  return runner();
}

// Registers a ToolModule on the given server with the correct callback signature.
// Centralizes the minimal necessary casting to keep tool modules clean.
export function registerToolModule<I = unknown>(server: McpServer, mod: ToolModule<I>): void {
  if (mod.inputSchema !== undefined) {
    const cb = wrapWithArgs(mod.name, mod.handler);
    // About the cast: The SDK bundles its own `zod`, so ZodRawShape is nominally different.
    // We keep tools decoupled and cast only at this boundary. Runtime validation remains in SDK.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (server.registerTool as any)(mod.name, { description: mod.description, inputSchema: mod.inputSchema, annotations: mod.annotations }, cb);
  } else {
    const cb = wrapNoArgs(mod.name, mod.handler);
    // See note above re: single boundary cast due to Zod instance mismatch.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (server.registerTool as any)(mod.name, { description: mod.description, annotations: mod.annotations }, cb);
  }
}

function wrapWithArgs<I>(name: string, fn: (args: I, extra: ToolExtra) => Promise<CallToolResult>): (args: I, extra: ToolExtra) => Promise<CallToolResult> {
  return async (args: I, extra: ToolExtra): Promise<CallToolResult> =>
    runThrough<CallToolResult>(name, extra, () => fn(args, extra));
}

function wrapNoArgs(name: string, fn: (extra: ToolExtra) => Promise<CallToolResult>): (extra: ToolExtra) => Promise<CallToolResult> {
  return async (extra: ToolExtra): Promise<CallToolResult> =>
    runThrough<CallToolResult>(name, extra, () => fn(extra));
}
