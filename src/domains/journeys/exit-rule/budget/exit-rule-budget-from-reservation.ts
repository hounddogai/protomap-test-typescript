import { BranchReservation } from "../../branch/snapshot/branch-reservation.js";
import { weightedBranchProfileWeight } from "../../branch/snapshot/weighted-branch-profile-policy.js";
import { ExitRuleBudget, newExitRuleBudget } from "./exit-rule-budget.js";

export function summarizeBranchReservationsForBudget(items: BranchReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveExitRuleBudgetsFromReservation(items: BranchReservation[]): ExitRuleBudget[] {
  const out: ExitRuleBudget[] = [];
  for (const item of items) {
    const derived = newExitRuleBudget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreExitRuleBudget(item: ExitRuleBudget): number {
  return weightedBranchProfileWeight(4, true);
}
