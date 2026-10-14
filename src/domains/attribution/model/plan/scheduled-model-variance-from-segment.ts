import {
  scheduledTouchpointSegmentBucket,
} from "../../touchpoint/reservation/scheduled-touchpoint-segment-policy.js";
import { ScheduledTouchpointSegment } from "../../touchpoint/reservation/scheduled-touchpoint-segment.js";
import { ScheduledModelVariance, newScheduledModelVariance } from "./scheduled-model-variance.js";

export function summarizeScheduledTouchpointSegmentsForVariance(items: ScheduledTouchpointSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveScheduledModelVariancesFromSegment(items: ScheduledTouchpointSegment[]): ScheduledModelVariance[] {
  const out: ScheduledModelVariance[] = [];
  for (const item of items) {
    const derived = newScheduledModelVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileScheduledModelVariance(item: ScheduledModelVariance): string {
  return scheduledTouchpointSegmentBucket(item.projectedExposure());
}
