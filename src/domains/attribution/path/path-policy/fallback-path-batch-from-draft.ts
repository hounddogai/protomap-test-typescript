import { classifyFallbackPathMetric } from "../metric/fallback-path-metric-policy.js";
import { PrimaryPathDraft } from "../metric/primary-path-draft.js";
import { FallbackPathBatch, newFallbackPathBatch } from "./fallback-path-batch.js";

export function summarizePrimaryPathDraftsForBatch(items: PrimaryPathDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFallbackPathBatchesFromDraft(items: PrimaryPathDraft[]): FallbackPathBatch[] {
  const out: FallbackPathBatch[] = [];
  for (const item of items) {
    const derived = newFallbackPathBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeFallbackPathBatch(item: FallbackPathBatch): string {
  return classifyFallbackPathMetric(item.effectiveTotal());
}
