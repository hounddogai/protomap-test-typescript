import { ActivationBudget } from "../../activation/bundle/activation-budget.js";
import { strictActivationClaimWeight } from "../../activation/bundle/strict-activation-claim-policy.js";
import { CohortWindow, newCohortWindow } from "./cohort-window.js";

export function summarizeActivationBudgetsForWindow(items: ActivationBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCohortWindowsFromBudget(items: ActivationBudget[]): CohortWindow[] {
  const out: CohortWindow[] = [];
  for (const item of items) {
    const derived = newCohortWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCohortWindow(item: CohortWindow): number {
  return strictActivationClaimWeight(1, true);
}
