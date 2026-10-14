import { AdaptiveSuppressionPolicy } from "../../suppression/allocation/adaptive-suppression-policy.js";
import { suppressionAllocationWeight } from "../../suppression/allocation/suppression-allocation-policy.js";
import { ManualOptOutProfile, newManualOptOutProfile } from "./manual-opt-out-profile.js";

export function summarizeAdaptiveSuppressionPoliciesForProfile(items: AdaptiveSuppressionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveManualOptOutProfilesFromPolicy(items: AdaptiveSuppressionPolicy[]): ManualOptOutProfile[] {
  const out: ManualOptOutProfile[] = [];
  for (const item of items) {
    const derived = newManualOptOutProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualOptOutProfile(item: ManualOptOutProfile): number {
  return suppressionAllocationWeight(7, true);
}
