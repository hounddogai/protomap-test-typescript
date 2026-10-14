import { CreditBudget } from "../../credit/override-item/credit-budget.js";
import { creditExceptionWeight } from "../../credit/override-item/credit-exception-policy.js";
import { LenientConversionMetric, newLenientConversionMetric } from "./lenient-conversion-metric.js";

export function summarizeCreditBudgetsForMetric(items: CreditBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLenientConversionMetricsFromBudget(items: CreditBudget[]): LenientConversionMetric[] {
  const out: LenientConversionMetric[] = [];
  for (const item of items) {
    const derived = newLenientConversionMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyLenientConversionMetric(item: LenientConversionMetric): number {
  return creditExceptionWeight(9, true);
}
