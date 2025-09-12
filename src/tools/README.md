# Tools

This directory contains MCP tool modules.

Each tool lives in its own folder and is registered through the tools aggregator. This guide shows how to add a new tool end-to-end, with examples for both parameterless and parameterized tools.
Notes:
- The project keeps tool modules decoupled from the SDK's internal Zod instance; we only pass the raw shape derived from `argsSchema` to the SDK during registration.
- Each tool module exports an `Args` type derived from its `argsSchema` for external consumers.
- For extracting argument types from imported tool modules, use the utility type: `type MyArgs = ToolArgs<typeof myToolModule>`.

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

## Architecture Overview

High-level goals:

- Minimize friction when adding a tool (one small folder, one export).
- Keep strong typing locally without bleeding complex generics across the codebase.
- Centralize cross-cutting behavior (logging, abort) once.
- Avoid speculative abstraction; only extract when duplication recurs.

### Components

| Piece | File | Responsibility |
|-------|------|----------------|
| ToolModule / defineTool | `src/tools/types.ts` | Factory requiring a mandatory `argsSchema` (empty object for no-arg tools) and a unified handler signature. |
| Registrar | `src/tools/register-tool.ts` | Bridges local ToolModule to the MCP SDK `server.addTool` overloads; applies middleware chain. Single controlled type boundary cast lives here. |
| Aggregator | `src/tools/index.ts` | Imports individual modules and registers them imperatively. Also emits a summary log & triggers `sendToolListChanged`. |
| Middleware | `src/tools/middlewares/*.ts` | Pure wrappers (`withLogging`, `withAbort`) composed in a fixed order. |
| AppleScript runtime | `src/runtime/apple-runner.ts` | Centralized timeout configuration; all AppleScript operations flow through this instance. |

### Handler Signature Simplification

We use ONE internal handler shape: `(args: any, extra: ToolExtra) => Promise<CallToolResult>`.

Reasons:

- Eliminates variance problems that arose when storing heterogeneous generic tool definitions in arrays.
- Avoids “erasure” layers or unsafe widespread casts; only the registrar performs the necessary narrow cast when calling the SDK.
- Enables uniform middleware composition independent of whether a tool has parameters.

### Schema Strategy (Zod Decoupling)

- Tool modules define a local `inputShape` (plain object of Zod validators) and optionally a private full `z.object(...)` for inference.
- We intentionally DO NOT export the Zod instance itself beyond the tool boundary; the registrar passes the shape to the SDK, which constructs its own schema instance.
- Benefit: isolates us from SDK-bundled Zod version mismatches and keeps public surface minimal.
- Every tool supplies an `argsSchema`. For no-argument tools use `z.object({})`.

### Validation Philosophy

1. Structural & *semantic* input validation should live inside the Zod schema via `refine()` / custom validators whenever the error can be determined synchronously from provided arguments (e.g. regex syntax, range checks, mutually exclusive fields).
2. Runtime / environmental failures (AppleScript errors, I/O) are surfaced inside the handler as tool errors.
3. Prefer failing fast at schema level instead of silently degrading behavior (e.g. invalid regex → immediate validation error, not “ignored filter”).
4. Keep handler bodies focused on orchestration (fetch → join → filter → transform → format) — no ad-hoc argument validation spread across steps.
5. If a future rule depends on dynamic state (e.g. “windowId must exist”), decide deliberately:
  - Cheap lookup available? Perform a pre-flight step early.
  - Expensive or asynchronous? Keep it as a domain error inside the handler.

Rationale: centralizing validation yields a single source of truth, reduces branching in handlers, and produces consistent error formatting for users/hosts.

### Middleware Pipeline

Current order (inside `register-tool.ts`):

```
user handler
  ↓ withAbort (fast fail on cancellation)
  ↓ withLogging (structured start/finish/error logs)
  ↓ registrar wrapper (schema adaptation → SDK)
```

Rules:

- Middleware must be pure w.r.t. tool logic (no hidden global mutation beyond logging / abort semantics).
- To add middleware: implement `(next) => (args, extra) => result` and insert it in the chain list in `register-tool.ts`.

### Error Handling Boundary

- Tool handlers return `{ isError: true, content: [...] }` for expected domain failures (e.g. AppleScript operation failed).
- Throwing is reserved for programmer errors; middleware/registrar will log and surface a generic failure.
- AppleScript failures are normalized via `getUserFriendlyMessage` before returning.

### Design Choices & Trade-offs

| Decision | Rationale | Trade-off |
|----------|-----------|----------|
| Uniform handler signature | Simplifies registry & middleware; avoids generic gymnastics | Loses some compile-time distinction for arg-less tools (acceptable) |
| Local Zod shape only | Decouple from SDK Zod; easier future schema migration | Slight indirection when reading code (shape vs full object) |
| Imperative registration | Explicit ordering & side effects (logging) easy to control | Not auto-discovering tools (add step for new modules) |
| Plain modules over static classes | Smaller surface, easier tree-shaking and testing | No namespacing via class (module path suffices) |

### When to Extract Shared Utilities

Follow YAGNI: only promote something out of a tool folder after ≥2 tools need it. Current shared examples live under `src/utils/` or model definitions under `src/models/`.

### Adding a New Tool (Concise Checklist)

1. Create directory `src/tools/<name>/` with `index.ts`.
2. Export `name`, `description`, mandatory `argsSchema` (use `z.object({})` if no args), and `handler`.
3. Import its `module` in `src/tools/index.ts` and add to the registration list.
4. (Optional) Add unit tests co-located in the tool folder.
5. Run lint + tests.

That’s the full ceremony; no extra wiring required.

---

The remainder of this document shows concrete examples (no-args and parameterized tools) and the per-tool reference.

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

All tools declare an `argsSchema` using Zod. The middleware validates inputs before the handler runs.

1) Create `src/tools/say-message/index.ts`:

```ts
import type { ToolModule } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const name = "say_message" as const;
export const description = "Echo a message back to the caller" as const;

const argsSchema = z.object({
  message: z.string().min(1, "message is required"),
});

/** Exported argument type for external consumers. */
export type Args = z.infer<typeof argsSchema>;

export async function handler(args: Args): Promise<CallToolResult> {
  return { content: [{ type: "text", text: `You said: ${args.message}` }] };
}

export const module: ToolModule = {
  name,
  description,
  argsSchema,
  handler,
};
```

2) Register it in `src/tools/index.ts` the same way as above.

Notes:
- The project keeps tool modules decoupled from the SDK’s internal Zod instance; we only pass the raw shape derived from `argsSchema` to the SDK during registration.

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

## Tool Reference

### list_tabs

Lists browser tabs with optional filtering, grouping, and sorting. Output is plain text for maximum MCP host compatibility.

Inputs (all optional unless stated):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pattern` | string (regex, case-insensitive) | — | Filters tabs whose URL OR title matches the pattern. Invalid patterns are currently ignored silently (future change: surface as error). |
| `groupBy` | `"none" | "window" | "host" | "mode"` | `"none"` | Group tabs. `mode` groups by window mode (normal/incognito). |
| `windowId` | number or number[] | — | Include only tabs whose `windowId` matches (single) or is in the provided list. |
| `mode` | `"normal" | "incognito"` | — | Filter by window mode; triggers a window metadata join. |
| `loading` | boolean | — | `true` = only loading tabs, `false` = only fully loaded tabs. |
| `hostFilter` | string (regex, case-insensitive) | — | Filters by normalized host (derived via `new URL(url).host.toLowerCase()`; invalid URLs map to empty host). |
| `orderBy` | `"title" | "url" | "host" | "windowId" | "tabId" | "mode" | "loading"` | — | Sorts tabs WITHIN each group. If omitted, original ordering from the AppleScript result is preserved. |

Notes:

- Group sorting: groups are sorted by key (numeric for `window`, lexical for `host`/`none`, and `normal < incognito` for `mode`).
- `(no host)` placeholder: when URL parsing fails (invalid / non-HTTP(S) scheme), host grouping labels these tabs as `(no host)`.
- Regex handling: invalid `pattern` / `hostFilter` is ignored (tool behaves as if not provided). This will likely change to an explicit error to aid debugging.
- Performance: window metadata is only loaded when `mode` filter or `groupBy: "mode"` requires it.

Example invocations (conceptual – actual invocation UI depends on your MCP host):

1. Group by host, sort each group by title:
   ```json
   { "groupBy": "host", "orderBy": "title" }
   ```
2. Tabs from windows 1 or 3 only, filter titles/URLs containing "docs":
   ```json
   { "windowId": [1, 3], "pattern": "docs" }
   ```
3. Incognito tabs only, grouped by window:
   ```json
   { "mode": "incognito", "groupBy": "window" }
   ```
4. Filter by host (example.com or example.org), ungrouped:
   ```json
   { "hostFilter": "^example\\.(com|org)$" }
   ```

Sample output (grouped by host):

```
Found 5 tabs
Grouped by: host (3 groups)

## example.com (2 tabs)
• Home – Example
  https://example.com/

• Docs – Example
  https://example.com/docs

## news.ycombinator.com (2 tabs)
• Hacker News
  https://news.ycombinator.com/

• Ask HN: Something
  https://news.ycombinator.com/item?id=123

## (no host) (1 tab)
• Untitled
  chrome://version/
```

Edge cases:

- No matches → `"No tabs found matching the criteria."`
- Large counts are listed fully (future enhancement may warn when counts exceed a threshold).
