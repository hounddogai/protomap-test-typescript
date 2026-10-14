import { LegacyOptOutBudget } from "../../opt-out/batch/legacy-opt-out-budget.js";
import { normalizeStrictOptOutBatchCode } from "../../opt-out/batch/strict-opt-out-batch-policy.js";
import { BatchedSuppressionPlan, newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

export function summarizeLegacyOptOutBudgetsForPlan(items: LegacyOptOutBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBatchedSuppressionPlansFromBudget(items: LegacyOptOutBudget[]): BatchedSuppressionPlan[] {
  const out: BatchedSuppressionPlan[] = [];
  for (const item of items) {
    const derived = newBatchedSuppressionPlan(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyBatchedSuppressionPlan(item: BatchedSuppressionPlan): string {
  return normalizeStrictOptOutBatchCode(item.code);
}
