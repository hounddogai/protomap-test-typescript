import { classifyLevelClaim } from "../../level/claim/level-claim-policy.js";
import { WeightedLevelVariance } from "../../level/claim/weighted-level-variance.js";
import { StrictBadgeAllocation, newStrictBadgeAllocation } from "./strict-badge-allocation.js";

export function summarizeWeightedLevelVariancesForAllocation(items: WeightedLevelVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictBadgeAllocationsFromVariance(items: WeightedLevelVariance[]): StrictBadgeAllocation[] {
  const out: StrictBadgeAllocation[] = [];
  for (const item of items) {
    const derived = newStrictBadgeAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignStrictBadgeAllocation(item: StrictBadgeAllocation): string {
  return classifyLevelClaim(item.weightedTotal());
}
