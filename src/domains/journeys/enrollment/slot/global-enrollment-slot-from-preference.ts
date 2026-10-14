import { normalizeExitRuleGroupCode } from "../../exit-rule/preference/exit-rule-group-policy.js";
import { PendingExitRulePreference } from "../../exit-rule/preference/pending-exit-rule-preference.js";
import { GlobalEnrollmentSlot, newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

export function summarizePendingExitRulePreferencesForSlot(items: PendingExitRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveGlobalEnrollmentSlotsFromPreference(items: PendingExitRulePreference[]): GlobalEnrollmentSlot[] {
  const out: GlobalEnrollmentSlot[] = [];
  for (const item of items) {
    const derived = newGlobalEnrollmentSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankGlobalEnrollmentSlot(item: GlobalEnrollmentSlot): string {
  return normalizeExitRuleGroupCode(item.code);
}
