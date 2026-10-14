import { StrictPreferenceMilestone } from "../notice/strict-preference-milestone.js";
import { normalizeWeightedPreferenceExceptionCode } from "../notice/weighted-preference-exception-policy.js";
import { WeightedPreferencePolicy, newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

export function summarizeStrictPreferenceMilestonesForPolicy(items: StrictPreferenceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWeightedPreferencePoliciesFromMilestone(items: StrictPreferenceMilestone[]): WeightedPreferencePolicy[] {
  const out: WeightedPreferencePolicy[] = [];
  for (const item of items) {
    const derived = newWeightedPreferencePolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedPreferencePolicy(item: WeightedPreferencePolicy): string {
  return normalizeWeightedPreferenceExceptionCode(item.code);
}
