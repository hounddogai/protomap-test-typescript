import { DeflectionSchedule } from "../../deflection/summary/deflection-schedule.js";
import { classifyDeflectionSummary } from "../../deflection/summary/deflection-summary-policy.js";
import { CsatMetric, newCsatMetric } from "./csat-metric.js";

export function summarizeDeflectionSchedulesForMetric(items: DeflectionSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCsatMetricsFromSchedule(items: DeflectionSchedule[]): CsatMetric[] {
  const out: CsatMetric[] = [];
  for (const item of items) {
    const derived = newCsatMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCsatMetric(item: CsatMetric): string {
  return classifyDeflectionSummary(item.adjustedValue());
}
