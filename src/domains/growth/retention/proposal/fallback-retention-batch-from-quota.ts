import { LegacyRetentionQuota } from "../retention-adjustment/legacy-retention-quota.js";
import { manualRetentionScoreWeight } from "../retention-adjustment/manual-retention-score-policy.js";
import { FallbackRetentionBatch, newFallbackRetentionBatch } from "./fallback-retention-batch.js";

export function summarizeLegacyRetentionQuotasForBatch(items: LegacyRetentionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveFallbackRetentionBatchesFromQuota(items: LegacyRetentionQuota[]): FallbackRetentionBatch[] {
  const out: FallbackRetentionBatch[] = [];
  for (const item of items) {
    const derived = newFallbackRetentionBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackRetentionBatch(item: FallbackRetentionBatch): number {
  return manualRetentionScoreWeight(9, true);
}
