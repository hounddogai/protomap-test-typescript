import { lenientPacingSegmentBucket } from "../../pacing/segment/lenient-pacing-segment-policy.js";
import { PacingSegment } from "../../pacing/segment/pacing-segment.js";
import { PlacementMetric, newPlacementMetric } from "./placement-metric.js";

export function summarizePacingSegmentsForMetric(items: PacingSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePlacementMetricsFromSegment(items: PacingSegment[]): PlacementMetric[] {
  const out: PlacementMetric[] = [];
  for (const item of items) {
    const derived = newPlacementMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimatePlacementMetric(item: PlacementMetric): string {
  return lenientPacingSegmentBucket(item.projectedExposure());
}
