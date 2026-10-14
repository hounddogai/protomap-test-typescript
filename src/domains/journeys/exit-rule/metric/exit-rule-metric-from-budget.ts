import { RollingWaitBudget } from "../../wait/budget/rolling-wait-budget.js";
import { waitBudgetBucket } from "../../wait/budget/wait-budget-policy.js";
import { ExitRuleMetric, newExitRuleMetric } from "./exit-rule-metric.js";

export function summarizeRollingWaitBudgetsForMetric(items: RollingWaitBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveExitRuleMetricsFromBudget(items: RollingWaitBudget[]): ExitRuleMetric[] {
  const out: ExitRuleMetric[] = [];
  for (const item of items) {
    const derived = newExitRuleMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignExitRuleMetric(item: ExitRuleMetric): string {
  return waitBudgetBucket(item.weightedVolume());
}
