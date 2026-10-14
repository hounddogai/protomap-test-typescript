import { InsightPreference } from "../../insight/preference/insight-preference.js";
import { scheduledInsightThresholdWeight } from "../../insight/preference/scheduled-insight-threshold-policy.js";
import { SeasonalQueueMetric, newSeasonalQueueMetric } from "./seasonal-queue-metric.js";

export function summarizeInsightPreferencesForMetric(items: InsightPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveSeasonalQueueMetricsFromPreference(items: InsightPreference[]): SeasonalQueueMetric[] {
  const out: SeasonalQueueMetric[] = [];
  for (const item of items) {
    const derived = newSeasonalQueueMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planSeasonalQueueMetric(item: SeasonalQueueMetric): number {
  return scheduledInsightThresholdWeight(6, true);
}
