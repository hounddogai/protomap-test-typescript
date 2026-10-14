import { branchExceptionBucket } from "../../branch/exception/branch-exception-policy.js";
import { BranchPreference } from "../../branch/exception/branch-preference.js";
import { StepBudget, newStepBudget } from "./step-budget.js";

export function summarizeBranchPreferencesForBudget(items: BranchPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStepBudgetsFromPreference(items: BranchPreference[]): StepBudget[] {
  const out: StepBudget[] = [];
  for (const item of items) {
    const derived = newStepBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeStepBudget(item: StepBudget): string {
  return branchExceptionBucket(item.weightedLoad());
}
