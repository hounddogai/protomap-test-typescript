import { BatchedDoubleOptInPlan } from "../../double-opt-in/in-profile/batched-double-opt-in-plan.js";
import {
  tieredDoubleOptInProfileWeight,
} from "../../double-opt-in/in-profile/tiered-double-opt-in-profile-policy.js";
import { FallbackPreferenceForecast, newFallbackPreferenceForecast } from "./fallback-preference-forecast.js";

export function summarizeBatchedDoubleOptInPlansForForecast(items: BatchedDoubleOptInPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveFallbackPreferenceForecastsFromPlan(items: BatchedDoubleOptInPlan[]): FallbackPreferenceForecast[] {
  const out: FallbackPreferenceForecast[] = [];
  for (const item of items) {
    const derived = newFallbackPreferenceForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackPreferenceForecast(item: FallbackPreferenceForecast): number {
  return tieredDoubleOptInProfileWeight(6, true);
}
