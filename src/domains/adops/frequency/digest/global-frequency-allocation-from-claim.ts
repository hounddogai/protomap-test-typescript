import { PlacementClaim } from "../../placement/ledger/placement-claim.js";
import { tieredPlacementThresholdWeight } from "../../placement/ledger/tiered-placement-threshold-policy.js";
import { GlobalFrequencyAllocation, newGlobalFrequencyAllocation } from "./global-frequency-allocation.js";

export function summarizePlacementClaimsForAllocation(items: PlacementClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveGlobalFrequencyAllocationsFromClaim(items: PlacementClaim[]): GlobalFrequencyAllocation[] {
  const out: GlobalFrequencyAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalFrequencyAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceGlobalFrequencyAllocation(item: GlobalFrequencyAllocation): number {
  return tieredPlacementThresholdWeight(7, true);
}
