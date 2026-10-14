import { touchpointThresholdWeight } from "../threshold/touchpoint-threshold-policy.js";
import { TouchpointThreshold } from "../threshold/touchpoint-threshold.js";
import { RollingTouchpointSegment, newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

export function summarizeTouchpointThresholdsForSegment(items: TouchpointThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRollingTouchpointSegmentsFromThreshold(items: TouchpointThreshold[]): RollingTouchpointSegment[] {
  const out: RollingTouchpointSegment[] = [];
  for (const item of items) {
    const derived = newRollingTouchpointSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRollingTouchpointSegment(item: RollingTouchpointSegment): number {
  return touchpointThresholdWeight(9, true);
}
