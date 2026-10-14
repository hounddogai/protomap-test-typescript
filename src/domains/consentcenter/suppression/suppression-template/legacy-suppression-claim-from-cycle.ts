import {
  weightedSubscriptionCycleBucket,
} from "../../subscription/subscription-cycle/weighted-subscription-cycle-policy.js";
import { WeightedSubscriptionCycle } from "../../subscription/subscription-cycle/weighted-subscription-cycle.js";
import { LegacySuppressionClaim, newLegacySuppressionClaim } from "./legacy-suppression-claim.js";

export function summarizeWeightedSubscriptionCyclesForClaim(items: WeightedSubscriptionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveLegacySuppressionClaimsFromCycle(items: WeightedSubscriptionCycle[]): LegacySuppressionClaim[] {
  const out: LegacySuppressionClaim[] = [];
  for (const item of items) {
    const derived = newLegacySuppressionClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLegacySuppressionClaim(item: LegacySuppressionClaim): string {
  return weightedSubscriptionCycleBucket(item.measuredValue());
}
