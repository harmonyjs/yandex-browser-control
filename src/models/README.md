# Operations Models

This directory contains reusable, typed data contracts for the **Operations** layer. These models describe the stable shapes returned by AppleScript-backed operations and consumed by higher layers (Tools and Scenarios). They are intentionally minimal, focused, and independent of operation-specific inputs and outputs.

## What is included

- **Stable, reusable payload shapes** produced by multiple operations (for example, raw tab snapshots, window metadata, per-id operation outcomes, and JavaScript execution results).
- **Common primitives** that are shared across models (for example, a non-negative integer id, window mode, and window bounds). These small building blocks live under `src/models/common/`.

## What is not included

- **Operation-specific input/output schemas** such as parameters or unique response types that belong to a single operation. Those live alongside their corresponding operation's implementation files to keep this directory clean and reusable.
- **Types already provided by `@avavilov/apple-script`**, such as `RunResult` and `ActionCode`. We rely on the library for those wrappers and do not duplicate them here.

## Design principles

1. **Single responsibility per file**: each file defines precisely one Zod schema and its inferred TypeScript type.
2. **No cross-dependencies inside `common`**: files under `src/models/common/` must not import each other to prevent accidental dependency webs.
3. **Coercion at the edge**: AppleScript often returns textual values. Models use numeric and boolean coercion where appropriate to expose strongly typed fields to callers.
4. **Shape stability**: once published, the field set and semantics of each model must remain stable. Additive extensions are allowed only when they are optional and do not break existing consumers.
5. **Operations-first semantics**: models reflect what the browser exposes via AppleScript (raw state and generic outcomes). Any enriched or normalized data belongs to the Tools layer.

## Files and intent

- **`src/models/tab-raw.ts`**  
  Raw tab snapshot used by read operations. Captures window id, tab id, title, original URL, and loading status exactly as reported by the browser AppleScript dictionary. This is the canonical source for all tab-based tooling. It is intentionally unnormalized (no host extraction or URL cleanup).

- **`src/models/window-meta.ts`**  
  Raw window metadata used by read operations. Describes window id, z-order index, mode (normal or incognito), screen bounds, and visibility flags. This is the basis for window arrangement, activation, and tiling logic in higher layers.

- **`src/models/per-id-result.ts`**  
  Generic per-entity outcome used by many modify operations that act on multiple items at once. It records the target id, whether the action succeeded for that id, and an optional error message. This enables partial success reporting and safe retries.

- **`src/models/execute-js-result.ts`**  
  Result item for JavaScript execution in page contexts. It associates a tab id with a success flag, an optional raw result value, and an optional error message. The result payload is intentionally untyped at this level because page scripts may return arbitrary data.

### Common primitives

- **`src/models/common/non-negative-int.ts`**  
  A normalized non-negative integer used for identifiers and indices. It centralizes the coercion and validation logic for ids and counters that originate from AppleScript.

- **`src/models/common/window-mode.ts`**  
  The window mode enumeration with two values: normal and incognito. This aligns with what browsers expose through their AppleScript dictionaries.

- **`src/models/common/bounds.ts`**  
  A rectangle tuple representing window position and size: `[x, y, width, height]`. All components are integers, which is sufficient for typical window arrangement operations.

- **`src/models/common/empty.ts`**  
  An explicit empty object used by read operations that do not accept parameters. This makes operation signatures uniform and self-documenting.

## Rationale summary

This layout minimizes coupling, keeps reusable contracts in one predictable place, and reflects the separation of concerns between raw AppleScript access and Node.js application logic. It also makes testing easier: operations can be validated against these schemas, while tools can rely on stable shapes without duplicating validation rules.
