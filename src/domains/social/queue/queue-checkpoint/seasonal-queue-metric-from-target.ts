import { normalizeSeasonalReplyTargetCode } from "../../reply/target/seasonal-reply-target-policy.js";
import { SeasonalReplyTarget } from "../../reply/target/seasonal-reply-target.js";
import { SeasonalQueueMetric, newSeasonalQueueMetric } from "./seasonal-queue-metric.js";

export function summarizeSeasonalReplyTargetsForMetric(items: SeasonalReplyTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSeasonalQueueMetricsFromTarget(items: SeasonalReplyTarget[]): SeasonalQueueMetric[] {
  const out: SeasonalQueueMetric[] = [];
  for (const item of items) {
    const derived = newSeasonalQueueMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalQueueMetric(item: SeasonalQueueMetric): string {
  return normalizeSeasonalReplyTargetCode(item.code);
}
