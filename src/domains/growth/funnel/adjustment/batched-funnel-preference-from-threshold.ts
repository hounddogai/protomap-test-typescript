import { FallbackFunnelThreshold } from "../threshold/fallback-funnel-threshold.js";
import { classifyLenientFunnelClaim } from "../threshold/lenient-funnel-claim-policy.js";
import { BatchedFunnelPreference, newBatchedFunnelPreference } from "./batched-funnel-preference.js";

export function summarizeFallbackFunnelThresholdsForPreference(items: FallbackFunnelThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedFunnelPreferencesFromThreshold(items: FallbackFunnelThreshold[]): BatchedFunnelPreference[] {
  const out: BatchedFunnelPreference[] = [];
  for (const item of items) {
    const derived = newBatchedFunnelPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedFunnelPreference(item: BatchedFunnelPreference): string {
  return classifyLenientFunnelClaim(item.weightedValue());
}
