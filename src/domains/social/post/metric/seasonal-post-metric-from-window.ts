import { CappedQueueWindow } from "../../queue/queue-window/capped-queue-window.js";
import { lenientQueuePolicyBucket } from "../../queue/queue-window/lenient-queue-policy-policy.js";
import { SeasonalPostMetric, newSeasonalPostMetric } from "./seasonal-post-metric.js";

export function summarizeCappedQueueWindowsForMetric(items: CappedQueueWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSeasonalPostMetricsFromWindow(items: CappedQueueWindow[]): SeasonalPostMetric[] {
  const out: SeasonalPostMetric[] = [];
  for (const item of items) {
    const derived = newSeasonalPostMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSeasonalPostMetric(item: SeasonalPostMetric): string {
  return lenientQueuePolicyBucket(item.projectedVolume());
}
