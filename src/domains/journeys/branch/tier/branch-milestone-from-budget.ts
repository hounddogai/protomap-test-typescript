import { waitBudgetBucket } from "../../wait/budget/wait-budget-policy.js";
import { WaitBudget } from "../../wait/budget/wait-budget.js";
import { BranchMilestone, newBranchMilestone } from "./branch-milestone.js";

export function summarizeWaitBudgetsForMilestone(items: WaitBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBranchMilestonesFromBudget(items: WaitBudget[]): BranchMilestone[] {
  const out: BranchMilestone[] = [];
  for (const item of items) {
    const derived = newBranchMilestone(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateBranchMilestone(item: BranchMilestone): string {
  return waitBudgetBucket(item.netTotal());
}
