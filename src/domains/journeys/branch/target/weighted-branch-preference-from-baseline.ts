import { ManualExitRuleBaseline } from "../../exit-rule/rule-digest/manual-exit-rule-baseline.js";
import { pendingExitRuleDigestBucket } from "../../exit-rule/rule-digest/pending-exit-rule-digest-policy.js";
import { WeightedBranchPreference, newWeightedBranchPreference } from "./weighted-branch-preference.js";

export function summarizeManualExitRuleBaselinesForPreference(items: ManualExitRuleBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveWeightedBranchPreferencesFromBaseline(items: ManualExitRuleBaseline[]): WeightedBranchPreference[] {
  const out: WeightedBranchPreference[] = [];
  for (const item of items) {
    const derived = newWeightedBranchPreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedBranchPreference(item: WeightedBranchPreference): string {
  return pendingExitRuleDigestBucket(item.projectedTotal());
}
