import { normalizePrimaryStepForecastCode } from "../budget/primary-step-forecast-policy.js";
import { PrimaryStepForecast } from "../budget/primary-step-forecast.js";
import { StepTarget, newStepTarget } from "./step-target.js";

export function summarizePrimaryStepForecastsForTarget(items: PrimaryStepForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStepTargetsFromForecast(items: PrimaryStepForecast[]): StepTarget[] {
  const out: StepTarget[] = [];
  for (const item of items) {
    const derived = newStepTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitStepTarget(item: StepTarget): string {
  return normalizePrimaryStepForecastCode(item.code);
}
