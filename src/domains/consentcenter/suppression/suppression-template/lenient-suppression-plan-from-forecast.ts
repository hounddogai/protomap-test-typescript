import { LegacyDoubleOptInForecast } from "../../double-opt-in/budget/legacy-double-opt-in-forecast.js";
import { legacyDoubleOptInRollupWeight } from "../../double-opt-in/budget/legacy-double-opt-in-rollup-policy.js";
import { LenientSuppressionPlan, newLenientSuppressionPlan } from "./lenient-suppression-plan.js";

export function summarizeLegacyDoubleOptInForecastsForPlan(items: LegacyDoubleOptInForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLenientSuppressionPlansFromForecast(items: LegacyDoubleOptInForecast[]): LenientSuppressionPlan[] {
  const out: LenientSuppressionPlan[] = [];
  for (const item of items) {
    const derived = newLenientSuppressionPlan(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLenientSuppressionPlan(item: LenientSuppressionPlan): number {
  return legacyDoubleOptInRollupWeight(5, true);
}
