/**
 * @fileoverview Plain‑text formatting for list_tabs output.
 * Rationale:
 *  - Text is universally supported by MCP hosts (no rich block negotiation).
 *  - Human‑scannable; stable contract (no downstream schema churn).
 *  - Group headers only shown when grouping != none & >1 group (noise reduction).
 * Placeholders mapping (semantic buckets from safeHost() / grouping logic):
 *  (invalid)  → Invalid URL
 *  (file)     → File URL
 *  (internal) → Internal Page (chrome://*, extensions, etc.)
 *  (about)    → About Page (about:blank, etc.)
 *  (no host)  → Legacy fallback maintained temporarily for backward compatibility.
 * TODO: remove legacy "(no host)" mapping after confirming no persisted artifacts rely on it.
 */

import type { GroupKey } from "./schemas.js";
import type { TabWithHost } from "./types.js";
import { formatCountHeader } from "../shared/headers.js";

export function formatOutput(
  groups: Array<[string, TabWithHost[]]>,
  groupBy: GroupKey
): string {
  if (groups.length === 0) {
    return "No tabs found matching the criteria.";
  }

  const lines: string[] = [];
  const totalTabs = groups.reduce((sum, [, tabs]) => sum + tabs.length, 0);

  // Summary (with large result warning handled inside formatter)
  {
    // Extract to local variable so linter recognizes concrete string type
    const summaryHeader: string = formatCountHeader({ count: totalTabs, singular: "tab" });
    lines.push(summaryHeader);
  }
  if (groupBy !== "none" && groups.length > 1) {
    lines.push(`Grouped by: ${groupBy} (${groups.length} groups)`);
  }
  lines.push("");

  // Each group
  for (const [groupKey, tabs] of groups) {
    if (groupBy !== "none") {
      const groupLabel = formatGroupLabel(groupKey, groupBy);
      lines.push(`## ${groupLabel} (${tabs.length} tab${tabs.length !== 1 ? "s" : ""})`);
      lines.push("");
    }

    for (const tab of tabs) {
      const loadingIndicator = tab.loading ? " [Loading]" : "";
      lines.push(`• ${tab.title}${loadingIndicator}`);
      lines.push(`  ${tab.url}`);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function formatGroupLabel(key: string, groupBy: GroupKey): string {
  switch (groupBy) {
    case "window":
      return `Window ${key}`;
    case "host": {
      // Map semantic placeholders to friendlier labels.
      if (key === "(no host)") return "No host"; // legacy fallback
      if (key === "(invalid)") return "Invalid URL";
      if (key === "(file)") return "File URL";
      if (key === "(internal)") return "Internal Page";
      if (key === "(about)") return "About Page";
      return key;
    }
    case "mode":
      return key.charAt(0).toUpperCase() + key.slice(1) + " mode";
    case "none":
    default:
      return key;
  }
}