import { creditPreferenceWeight } from "../../credit/preference/credit-preference-policy.js";
import { CreditPreference } from "../../credit/preference/credit-preference.js";
import { LenientModelAssignment, newLenientModelAssignment } from "./lenient-model-assignment.js";

export function summarizeCreditPreferencesForAssignment(items: CreditPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLenientModelAssignmentsFromPreference(items: CreditPreference[]): LenientModelAssignment[] {
  const out: LenientModelAssignment[] = [];
  for (const item of items) {
    const derived = newLenientModelAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLenientModelAssignment(item: LenientModelAssignment): number {
  return creditPreferenceWeight(7, true);
}
