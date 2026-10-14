import {
  adaptiveDoubleOptInGroupWeight,
} from "../../double-opt-in/in-assignment/adaptive-double-opt-in-group-policy.js";
import { TieredDoubleOptInAssignment } from "../../double-opt-in/in-assignment/tiered-double-opt-in-assignment.js";
import { PendingSuppressionForecast, newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

export function summarizeTieredDoubleOptInAssignmentsForForecast(items: TieredDoubleOptInAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingSuppressionForecastsFromAssignment(items: TieredDoubleOptInAssignment[]): PendingSuppressionForecast[] {
  const out: PendingSuppressionForecast[] = [];
  for (const item of items) {
    const derived = newPendingSuppressionForecast(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePendingSuppressionForecast(item: PendingSuppressionForecast): number {
  return adaptiveDoubleOptInGroupWeight(2, true);
}
