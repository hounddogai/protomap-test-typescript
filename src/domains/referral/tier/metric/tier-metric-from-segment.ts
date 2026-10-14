import { LenientPayoutSegment } from "../../payout/segment/lenient-payout-segment.js";
import { classifyPayoutSummary } from "../../payout/segment/payout-summary-policy.js";
import { TierMetric, newTierMetric } from "./tier-metric.js";

export function summarizeLenientPayoutSegmentsForMetric(items: LenientPayoutSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTierMetricsFromSegment(items: LenientPayoutSegment[]): TierMetric[] {
  const out: TierMetric[] = [];
  for (const item of items) {
    const derived = newTierMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectTierMetric(item: TierMetric): string {
  return classifyPayoutSummary(item.weightedTotal());
}
