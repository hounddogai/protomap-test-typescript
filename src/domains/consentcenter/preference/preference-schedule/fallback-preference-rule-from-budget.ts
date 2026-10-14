import { DoubleOptInBudget } from "../../double-opt-in/budget/double-opt-in-budget.js";
import { legacyDoubleOptInForecastBucket } from "../../double-opt-in/budget/legacy-double-opt-in-forecast-policy.js";
import { FallbackPreferenceRule, newFallbackPreferenceRule } from "./fallback-preference-rule.js";

export function summarizeDoubleOptInBudgetsForRule(items: DoubleOptInBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFallbackPreferenceRulesFromBudget(items: DoubleOptInBudget[]): FallbackPreferenceRule[] {
  const out: FallbackPreferenceRule[] = [];
  for (const item of items) {
    const derived = newFallbackPreferenceRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateFallbackPreferenceRule(item: FallbackPreferenceRule): string {
  return legacyDoubleOptInForecastBucket(item.measuredValue());
}
