import { PrimaryStepForecast } from "../../step/budget/primary-step-forecast.js";
import { stepBudgetBucket } from "../../step/budget/step-budget-policy.js";
import { ExitRuleItem, newExitRuleItem } from "./exit-rule-item.js";

export function summarizePrimaryStepForecastsForItem(items: PrimaryStepForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveExitRuleItemsFromForecast(items: PrimaryStepForecast[]): ExitRuleItem[] {
  const out: ExitRuleItem[] = [];
  for (const item of items) {
    const derived = newExitRuleItem(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchExitRuleItem(item: ExitRuleItem): string {
  return stepBudgetBucket(item.projectedValue());
}
