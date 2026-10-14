import { normalizeExitRuleGroupCode } from "../../exit-rule/preference/exit-rule-group-policy.js";
import { PendingExitRulePreference } from "../../exit-rule/preference/pending-exit-rule-preference.js";
import { BranchReservation, newBranchReservation } from "./branch-reservation.js";

export function summarizePendingExitRulePreferencesForReservation(items: PendingExitRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBranchReservationsFromPreference(items: PendingExitRulePreference[]): BranchReservation[] {
  const out: BranchReservation[] = [];
  for (const item of items) {
    const derived = newBranchReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyBranchReservation(item: BranchReservation): string {
  return normalizeExitRuleGroupCode(item.code);
}
