# Tools

This directory contains MCP tool modules.

Each tool lives in its own folder and is registered through the tools aggregator. This guide shows how to add a new tool end-to-end, with examples for both parameterless and parameterized tools.

## Where things live

- Tool modules: `src/tools/<tool-name>/index.ts`
- Tools aggregator: `src/tools/index.ts`
- Tool contract types: `src/tools/types.ts`
- Registration helper (wraps middleware, types): `src/tools/register-tool.ts`
- Middleware used for every tool call: 
  - `src/tools/middlewares/logging.ts`
  - `src/tools/middlewares/abort.ts`
- AppleScript runner utilities: `src/runtime/apple-runner.ts` and `@avavilov/apple-script`

Conventions:
- Directory names: kebab-case (e.g., `open-active-tab`)
- Tool names (exposed to MCP): snake_case (e.g., `open_active_tab`)

## Minimal no-args tool

1) Create folder `src/tools/hello-world/` and file `index.ts`:

```ts
import type { ToolModule } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const name = "hello_world" as const;
export const description = "Say hello from the MCP server" as const;

export async function handler(): Promise<CallToolResult> {
  return { content: [{ type: "text", text: "Hello from Yandex Browser Control" }] };
}

export const module: ToolModule = { name, description, handler };
```

2) Register it in `src/tools/index.ts`:

```ts
// 1) import the module
import { module as helloWorld } from "./hello-world/index.js";

// 2) add to the tools array
const tools: Array<ToolModule> = [
  helloWorld,
  // existing tools...
];
```

That’s it. The registry helper will wrap your handler with logging and abort middleware automatically.

## Tool with parameters (validated via Zod)

When a tool accepts inputs, declare an `inputSchema` using Zod. The SDK will validate inputs before calling your handler.

1) Create `src/tools/say-message/index.ts`:

```ts
import type { ToolModule } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const name = "say_message" as const;
export const description = "Echo a message back to the caller" as const;

const inputSchema = z.object({
  message: z.string().min(1, "message is required"),
});

type Input = z.infer<typeof inputSchema>;

export async function handler(args: Input): Promise<CallToolResult> {
  return { content: [{ type: "text", text: `You said: ${args.message}` }] };
}

export const module: ToolModule<Input> = {
  name,
  description,
  inputSchema, // the Zod object
  handler,
};
```

2) Register it in `src/tools/index.ts` the same way as above.

Notes:
- The project deliberately keeps tool modules decoupled from the SDK’s Zod instance. You can safely pass `z.object(...)` as `inputSchema` — the central registrar handles the type boundary.

## Accessing SDK context (extra)

Handlers receive an `extra` context automatically through middleware. If your tool needs it (e.g., for cancellation), use the appropriate signature:

- No-args tool: `(extra) => Promise<CallToolResult>`
- With-args tool: `(args, extra) => Promise<CallToolResult>`

Example with cancellation check:

```ts
export async function handler(extra: ToolExtra): Promise<CallToolResult> {
  if (extra.signal.aborted) {
    return { isError: true, content: [{ type: "text", text: "Aborted" }] };
  }
  // work...
}
```

Note: you don’t have to wire abort/logging yourself — the registrar wraps your handler with `withAbort` and `withLogging` automatically.

## Returning results and errors

- Success: return `{ content: [{ type: 'text', text: '...' }] }`
- Error: return `{ isError: true, content: [{ type: 'text', text: 'message' }] }`
- You can also return other MCP content types supported by the SDK when needed.

## Optional: annotations

You can set `annotations` on a tool module to provide hints to hosts. See the `ToolAnnotations` type from the MCP SDK for supported fields.

```ts
export const module: ToolModule = {
  name,
  description,
  annotations: { /* optional hints for hosts */ },
  handler,
};
```
