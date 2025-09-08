# Operations

This directory contains **AppleScript-backed Operations** — the lowest layer of the arch stack. Each file defines a single operation for a target macOS browser app and **exports a typed `operation.*()` instance** from `@avavilov/apple-script`, together with **operation-specific Zod input and output schemas** (they may compose shared models from `src/models/**`) and their inferred TypeScript types.

Operations are intentionally **atomic, predictable, and stable**. They expose raw browser state or perform a focused action. All higher-level logic (URL normalization, grouping, sorting, RegExp matching, deduplication strategies) belongs to the Tools layer.

## What lives here

- One file per operation (for example, `get-tabs.ts`).
  - Current operations include:
    - `get-tabs.ts` — snapshot of tabs across all windows
    - `get-windows.ts` — snapshot of all windows with raw metadata
- Inside each file:
  - **Zod input schema** and `type` alias inferred from it.
  - **Zod output schema** and `type` alias inferred from it.
  - **Column mapping** (for `rows` operations): the `columns` array that maps AppleScript row indices to object keys.
  - The **exported `operation.*()` instance** (`rows`, `scalar`, `action`, or `sections`) that binds AppleScript code to the schemas.
- Operations **import normalization schemas** from `src/models/**` for row parsing (for example, `tabRawSchema`, `windowMetaSchema`).
- Operations **own the column order** and the AppleScript code. Models only define the shape and normalization rules.
- Operations **do not** depend on the runner; creating and configuring a runner (`createAppleRunner`) happens outside this directory.

## What does not live here

- No Tools or Scenarios logic.
- No operation generators, CLIs, or runners.
- No shared operation-level input/output schemas across different operations (each operation’s I/O schema stays local), while **shared payload models** (e.g., `TabRaw`) live in `src/models/**` and can be reused.
- No duplication of `@avavilov/apple-script` wrappers and types (for example, `RunResult`, `ActionCode`).

## Architectural guidelines

- **Single responsibility**: each operation file does exactly one thing against the browser AppleScript dictionary.
- **Shape stability**: input and output schemas define a contract that must not change in a breaking manner. Additive changes must be optional.
- **Raw facts only**: do not normalize URLs, do not parse hosts, and do not apply RegExp. Return raw data and simple booleans/ids.
- **Coercion at the edge**: AppleScript often returns text. Use Zod coercion to expose `number` and `boolean` fields reliably.
- **Kind selection**:
  - Use `rows` for tabular payloads (for example, snapshots of tabs or windows).
  - Use `scalar` for single values (for example, a title string or a single index).
  - Use `action` for imperative operations that only need a success code (`"0" | "1" | "2"`).
  - Use `sections` for grouped name → items payloads when truly necessary.
  - For `rows`, specify a `columns` array to deterministically map AppleScript row arrays to object keys expected by the output schema.
- **AppleScript scope**: keep scripts minimal and deterministic. Handle `missing value` explicitly and return the exact structure expected by the chosen kind.
- **No cross-operation coupling**: operations do not import each other. Reuse shared models from `src/models/**` instead.
- **Export convention**: Operations export **only** these public APIs:
  - `<OperationName>InputSchema` and `<OperationName>Input` type
  - `<OperationName>OutputSchema` and `<OperationName>Output` type
  - The operation instance itself (e.g., `getTabs`)
  - No intermediate types or row schemas are exported

## Testing

Co-locate small integration tests (e.g., `*.integration.spec.ts`) with operations when helpful to verify AppleScript contract and schema validation using the shared runner.

## Error model

- The library wraps every run in `RunResult<T>`:
  - Transport-level success or failure (`ok`, `error`) is **not** modeled here.
  - **`T` is the domain payload** defined by the operation’s output schema (for example, `TabRaw[]`, `PerIdResult[]`, or `ActionCode`).
- Prefer partial success payloads for batch actions (for example, per-id results) to enable idempotency and retries in higher layers.
    
## Rationale

Keeping input/output schemas **co-located** with their operation makes contracts explicit and reviewable, while shared payload models live in `src/models/**` to prevent duplication and drift. The separation of concerns is clear:
- **Models**: Define AppleScript-aware normalization schemas (using `as.record` from `@avavilov/apple-script`)
- **Operations**: Own the column mapping, AppleScript code, and operation configuration

This separation preserves the Operations layer as a **thin, testable, and stable boundary** over AppleScript, enabling faster iteration in Tools and Scenarios without risking regressions here.
