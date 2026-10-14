import { pathAllocationBucket } from "../../path/allocation/path-allocation-policy.js";
import { PendingPathRule } from "../../path/allocation/pending-path-rule.js";
import { ScheduledTouchpointSegment, newScheduledTouchpointSegment } from "./scheduled-touchpoint-segment.js";

export function summarizePendingPathRulesForSegment(items: PendingPathRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveScheduledTouchpointSegmentsFromRule(items: PendingPathRule[]): ScheduledTouchpointSegment[] {
  const out: ScheduledTouchpointSegment[] = [];
  for (const item of items) {
    const derived = newScheduledTouchpointSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignScheduledTouchpointSegment(item: ScheduledTouchpointSegment): string {
  return pathAllocationBucket(item.weightedTotal());
}
