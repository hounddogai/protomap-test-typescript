import { defaultEnrollmentDraftWeight } from "../../enrollment/draft/default-enrollment-draft-policy.js";
import { WeightedEnrollmentSlot } from "../../enrollment/draft/weighted-enrollment-slot.js";
import { PendingExitRulePreference, newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

export function summarizeWeightedEnrollmentSlotsForPreference(items: WeightedEnrollmentSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePendingExitRulePreferencesFromSlot(items: WeightedEnrollmentSlot[]): PendingExitRulePreference[] {
  const out: PendingExitRulePreference[] = [];
  for (const item of items) {
    const derived = newPendingExitRulePreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePendingExitRulePreference(item: PendingExitRulePreference): number {
  return defaultEnrollmentDraftWeight(7, true);
}
