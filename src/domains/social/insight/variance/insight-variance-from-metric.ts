import { classifyQueueMetric } from "../../queue/preference/queue-metric-policy.js";
import { QueueMetric } from "../../queue/preference/queue-metric.js";
import { InsightVariance, newInsightVariance } from "./insight-variance.js";

export function summarizeQueueMetricsForVariance(items: QueueMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveInsightVariancesFromMetric(items: QueueMetric[]): InsightVariance[] {
  const out: InsightVariance[] = [];
  for (const item of items) {
    const derived = newInsightVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankInsightVariance(item: InsightVariance): string {
  return classifyQueueMetric(item.weightedTotal());
}
