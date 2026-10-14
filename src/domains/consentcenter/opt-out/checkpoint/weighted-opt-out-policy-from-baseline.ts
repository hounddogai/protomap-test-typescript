import { FallbackOptOutBaseline } from "../agreement/fallback-opt-out-baseline.js";
import { pendingOptOutProfileBucket } from "../agreement/pending-opt-out-profile-policy.js";
import { WeightedOptOutPolicy, newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

export function summarizeFallbackOptOutBaselinesForPolicy(items: FallbackOptOutBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveWeightedOptOutPoliciesFromBaseline(items: FallbackOptOutBaseline[]): WeightedOptOutPolicy[] {
  const out: WeightedOptOutPolicy[] = [];
  for (const item of items) {
    const derived = newWeightedOptOutPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleWeightedOptOutPolicy(item: WeightedOptOutPolicy): string {
  return pendingOptOutProfileBucket(item.adjustedValue());
}
