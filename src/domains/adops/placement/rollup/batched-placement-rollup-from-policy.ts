import { normalizeStrictFrequencyPolicyCode } from "../../frequency/policy/strict-frequency-policy-policy.js";
import { StrictFrequencyPolicy } from "../../frequency/policy/strict-frequency-policy.js";
import { BatchedPlacementRollup, newBatchedPlacementRollup } from "./batched-placement-rollup.js";

export function summarizeStrictFrequencyPoliciesForRollup(items: StrictFrequencyPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBatchedPlacementRollupsFromPolicy(items: StrictFrequencyPolicy[]): BatchedPlacementRollup[] {
  const out: BatchedPlacementRollup[] = [];
  for (const item of items) {
    const derived = newBatchedPlacementRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyBatchedPlacementRollup(item: BatchedPlacementRollup): string {
  return normalizeStrictFrequencyPolicyCode(item.code);
}
