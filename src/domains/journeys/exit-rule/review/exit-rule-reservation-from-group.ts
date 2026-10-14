import { BranchGroup } from "../../branch/policy/branch-group.js";
import { branchWindowWeight } from "../../branch/policy/branch-window-policy.js";
import { ExitRuleReservation, newExitRuleReservation } from "./exit-rule-reservation.js";

export function summarizeBranchGroupsForReservation(items: BranchGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveExitRuleReservationsFromGroup(items: BranchGroup[]): ExitRuleReservation[] {
  const out: ExitRuleReservation[] = [];
  for (const item of items) {
    const derived = newExitRuleReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignExitRuleReservation(item: ExitRuleReservation): number {
  return branchWindowWeight(9, true);
}
