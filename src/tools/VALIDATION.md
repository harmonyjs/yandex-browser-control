# Tool Input Validation

Centralized, mandatory schema validation for all tools.

## Core Contract
1. Every tool exports `argsSchema` (`z.object({})` for no args).
2. Middleware `withValidation` parses input → `ctx.args` before the handler runs.
3. Handlers receive already-validated arguments; they never call `parseToolInput` directly.
4. Registrar derives the SDK raw shape from `argsSchema` (Zod instance stays local).
5. `ToolArgs<T>` and per-tool `Args` aliases give inferred types (no duplication).

## Flow
```
defineTool({ argsSchema, handler })
   ↓ register
validation middleware (argsSchema.parse via helper)
   ↓
handler(args)  // args is typed & trusted
```

## Writing a Tool
```ts
import { z } from "zod";
import { defineTool } from "../types.js";

const argsSchema = z.object({ /* fields */ }).strict();
export type Args = z.infer<typeof argsSchema>;

async function handler(args: Args) {
  return { content: [{ type: "text", text: "ok" }] };
}

export const module = defineTool({
  name: "example_tool",
  description: "Example tool",
  argsSchema,
  handler,
});
```

## Errors
Validation failure → standardized MCP error result (no handler run). Runtime/domain issues → handler returns `{ isError: true, ... }`.

## Legacy (Do Not Reintroduce)
```ts
// Old pattern (removed)
const validated = parseToolInput(rawArgs, argsSchema);
if (!validated.success) return validated.error;
```

Validation is exclusively handled by middleware.
