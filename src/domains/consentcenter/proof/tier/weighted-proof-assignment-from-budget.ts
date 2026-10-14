import { doubleOptInBudgetWeight } from "../../double-opt-in/budget/double-opt-in-budget-policy.js";
import { DoubleOptInBudget } from "../../double-opt-in/budget/double-opt-in-budget.js";
import { WeightedProofAssignment, newWeightedProofAssignment } from "./weighted-proof-assignment.js";

export function summarizeDoubleOptInBudgetsForAssignment(items: DoubleOptInBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveWeightedProofAssignmentsFromBudget(items: DoubleOptInBudget[]): WeightedProofAssignment[] {
  const out: WeightedProofAssignment[] = [];
  for (const item of items) {
    const derived = newWeightedProofAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedProofAssignment(item: WeightedProofAssignment): number {
  return doubleOptInBudgetWeight(2, true);
}
