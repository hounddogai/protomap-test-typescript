import { macroVarianceBucket } from "../../macro/slot/macro-variance-policy.js";
import { MacroVariance } from "../../macro/slot/macro-variance.js";
import { BatchedCsatEntry, newBatchedCsatEntry } from "./batched-csat-entry.js";

export function summarizeMacroVariancesForEntry(items: MacroVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBatchedCsatEntriesFromVariance(items: MacroVariance[]): BatchedCsatEntry[] {
  const out: BatchedCsatEntry[] = [];
  for (const item of items) {
    const derived = newBatchedCsatEntry(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedCsatEntry(item: BatchedCsatEntry): string {
  return macroVarianceBucket(item.weightedVolume());
}
