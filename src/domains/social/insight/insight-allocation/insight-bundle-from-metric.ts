import { classifyQueueRequest } from "../../queue/metric/queue-request-policy.js";
import { StrictQueueMetric } from "../../queue/metric/strict-queue-metric.js";
import { InsightBundle, newInsightBundle } from "./insight-bundle.js";

export function summarizeStrictQueueMetricsForBundle(items: StrictQueueMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveInsightBundlesFromMetric(items: StrictQueueMetric[]): InsightBundle[] {
  const out: InsightBundle[] = [];
  for (const item of items) {
    const derived = newInsightBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitInsightBundle(item: InsightBundle): string {
  return classifyQueueRequest(item.projectedVolume());
}
