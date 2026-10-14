import { normalizeInsightVarianceCode } from "../variance/insight-variance-policy.js";
import { InsightVariance } from "../variance/insight-variance.js";
import { InsightSchedule, newInsightSchedule } from "./insight-schedule.js";

export function summarizeInsightVariancesForSchedule(items: InsightVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveInsightSchedulesFromVariance(items: InsightVariance[]): InsightSchedule[] {
  const out: InsightSchedule[] = [];
  for (const item of items) {
    const derived = newInsightSchedule(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeInsightSchedule(item: InsightSchedule): string {
  return normalizeInsightVarianceCode(item.code);
}
