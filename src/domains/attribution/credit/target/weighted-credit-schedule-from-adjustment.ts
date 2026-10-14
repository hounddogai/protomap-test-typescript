import { DefaultPathAdjustment } from "../../path/fallback-path-adjustment/default-path-adjustment.js";
import { scheduledPathForecastWeight } from "../../path/fallback-path-adjustment/scheduled-path-forecast-policy.js";
import { WeightedCreditSchedule, newWeightedCreditSchedule } from "./weighted-credit-schedule.js";

export function summarizeDefaultPathAdjustmentsForSchedule(items: DefaultPathAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveWeightedCreditSchedulesFromAdjustment(items: DefaultPathAdjustment[]): WeightedCreditSchedule[] {
  const out: WeightedCreditSchedule[] = [];
  for (const item of items) {
    const derived = newWeightedCreditSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWeightedCreditSchedule(item: WeightedCreditSchedule): number {
  return scheduledPathForecastWeight(3, true);
}
