# Tool Reference

This document consolidates the per-tool reference for the Yandex Browser Control MCP server.

## list_tabs

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

## list_windows

Lists browser windows with optional filtering and single-key sorting. Plain text output optimized for broad MCP host compatibility.

Inputs (all optional):

| Field | Type | Description |
|-------|------|-------------|
| `windowId` | number or number[] | Restrict to specific window id(s). Empty array returns no results. |
| `mode` | `"normal" | "incognito"` | Filter by window mode. |
| `orderBy` | `"windowId" | "index" | "mode" | "visible" | "minimized" | "zoomed"` | Sort criterion (ascending / false<true). Omitted → original order. |

Sorting semantics:

- `mode`: ordering `normal < incognito < (unexpected)`.
- Boolean fields: `false` before `true`.
- Stable tiebreaker: `windowId` then `index` to keep output deterministic.

Output format:

```
Found N window(s)

• [windowId=1] index=0 mode=normal bounds={x, y, w, h} state=visible zoomed
• [windowId=2] index=1 mode=normal bounds={...} state=hidden minimized
• [windowId=3] index=2 mode=incognito bounds={...} state=visible
```

`state` tokens logic:

- Always includes one of: `visible` | `hidden` (derived from `visible` flag).
- Adds `minimized` if minimized.
- Adds `zoomed` if zoomed.

Edge cases:

- No matching windows → `No windows found matching the criteria.`
- Large result (`> LARGE_RESULT_THRESHOLD`) prepends a warning banner.

Examples:

1. List all windows sorted by index:
  ```json
  { "orderBy": "index" }
  ```
2. Incognito windows only:
  ```json
  { "mode": "incognito" }
  ```
3. Specific windows (1 and 3) sorted by minimized state:
  ```json
  { "windowId": [1,3], "orderBy": "minimized" }
  ```
