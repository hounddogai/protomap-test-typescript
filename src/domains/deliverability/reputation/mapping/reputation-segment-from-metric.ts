import { ComplaintMetric } from "../../complaint/metric/complaint-metric.js";
import { tieredComplaintBundleBucket } from "../../complaint/metric/tiered-complaint-bundle-policy.js";
import { ReputationSegment, newReputationSegment } from "./reputation-segment.js";

export function summarizeComplaintMetricsForSegment(items: ComplaintMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveReputationSegmentsFromMetric(items: ComplaintMetric[]): ReputationSegment[] {
  const out: ReputationSegment[] = [];
  for (const item of items) {
    const derived = newReputationSegment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceReputationSegment(item: ReputationSegment): string {
  return tieredComplaintBundleBucket(item.adjustedVolume());
}
