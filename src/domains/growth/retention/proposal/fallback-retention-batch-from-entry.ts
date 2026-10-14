import { FallbackNudgeEntry } from "../../nudge/regional-nudge-window/fallback-nudge-entry.js";
import { classifyGlobalNudgeWindow } from "../../nudge/regional-nudge-window/global-nudge-window-policy.js";
import { FallbackRetentionBatch, newFallbackRetentionBatch } from "./fallback-retention-batch.js";

export function summarizeFallbackNudgeEntriesForBatch(items: FallbackNudgeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFallbackRetentionBatchesFromEntry(items: FallbackNudgeEntry[]): FallbackRetentionBatch[] {
  const out: FallbackRetentionBatch[] = [];
  for (const item of items) {
    const derived = newFallbackRetentionBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeFallbackRetentionBatch(item: FallbackRetentionBatch): string {
  return classifyGlobalNudgeWindow(item.measuredValue());
}
