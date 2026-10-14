import {
  normalizeSeasonalEscalationScheduleCode,
} from "../../escalation/adjustment/seasonal-escalation-schedule-policy.js";
import { SeasonalEscalationSchedule } from "../../escalation/adjustment/seasonal-escalation-schedule.js";
import { DeflectionMetric, newDeflectionMetric } from "./deflection-metric.js";

export function summarizeSeasonalEscalationSchedulesForMetric(items: SeasonalEscalationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveDeflectionMetricsFromSchedule(items: SeasonalEscalationSchedule[]): DeflectionMetric[] {
  const out: DeflectionMetric[] = [];
  for (const item of items) {
    const derived = newDeflectionMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankDeflectionMetric(item: DeflectionMetric): string {
  return normalizeSeasonalEscalationScheduleCode(item.code);
}
