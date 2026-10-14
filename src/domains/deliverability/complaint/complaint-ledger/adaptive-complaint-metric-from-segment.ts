import { weightedSenderSegmentWeight } from "../../sender/sender-mapping/weighted-sender-segment-policy.js";
import { WeightedSenderSegment } from "../../sender/sender-mapping/weighted-sender-segment.js";
import { AdaptiveComplaintMetric, newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

export function summarizeWeightedSenderSegmentsForMetric(items: WeightedSenderSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptiveComplaintMetricsFromSegment(items: WeightedSenderSegment[]): AdaptiveComplaintMetric[] {
  const out: AdaptiveComplaintMetric[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveAdaptiveComplaintMetric(item: AdaptiveComplaintMetric): number {
  return weightedSenderSegmentWeight(8, true);
}
