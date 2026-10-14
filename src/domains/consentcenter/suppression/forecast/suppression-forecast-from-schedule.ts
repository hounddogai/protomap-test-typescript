import { classifyRollingProofSchedule } from "../../proof/audit/rolling-proof-schedule-policy.js";
import { RollingProofSchedule } from "../../proof/audit/rolling-proof-schedule.js";
import { SuppressionForecast, newSuppressionForecast } from "./suppression-forecast.js";

export function summarizeRollingProofSchedulesForForecast(items: RollingProofSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveSuppressionForecastsFromSchedule(items: RollingProofSchedule[]): SuppressionForecast[] {
  const out: SuppressionForecast[] = [];
  for (const item of items) {
    const derived = newSuppressionForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectSuppressionForecast(item: SuppressionForecast): string {
  return classifyRollingProofSchedule(item.weightedVolume());
}
