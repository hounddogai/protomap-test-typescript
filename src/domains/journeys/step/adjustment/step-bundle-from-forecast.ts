import { stepForecastWeight } from "../override-item/step-forecast-policy.js";
import { StepForecast } from "../override-item/step-forecast.js";
import { StepBundle, newStepBundle } from "./step-bundle.js";

export function summarizeStepForecastsForBundle(items: StepForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStepBundlesFromForecast(items: StepForecast[]): StepBundle[] {
  const out: StepBundle[] = [];
  for (const item of items) {
    const derived = newStepBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileStepBundle(item: StepBundle): number {
  return stepForecastWeight(7, true);
}
