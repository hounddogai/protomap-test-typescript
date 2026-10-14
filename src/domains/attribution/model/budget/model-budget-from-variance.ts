import { classifyModelVariance } from "../record-item/model-variance-policy.js";
import { ModelVariance } from "../record-item/model-variance.js";
import { ModelBudget, newModelBudget } from "./model-budget.js";

export function summarizeModelVariancesForBudget(items: ModelVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveModelBudgetsFromVariance(items: ModelVariance[]): ModelBudget[] {
  const out: ModelBudget[] = [];
  for (const item of items) {
    const derived = newModelBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchModelBudget(item: ModelBudget): string {
  return classifyModelVariance(item.adjustedVolume());
}
