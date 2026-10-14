import { PreferenceAllocation } from "../../preference/assignment/preference-allocation.js";
import { preferenceWindowWeight } from "../../preference/assignment/preference-window-policy.js";
import { PrimarySuppressionTier, newPrimarySuppressionTier } from "./primary-suppression-tier.js";

export function summarizePreferenceAllocationsForTier(items: PreferenceAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePrimarySuppressionTiersFromAllocation(items: PreferenceAllocation[]): PrimarySuppressionTier[] {
  const out: PrimarySuppressionTier[] = [];
  for (const item of items) {
    const derived = newPrimarySuppressionTier(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePrimarySuppressionTier(item: PrimarySuppressionTier): number {
  return preferenceWindowWeight(1, true);
}
