import { globalRetentionCheckpointBucket } from "../checkpoint/global-retention-checkpoint-policy.js";
import { GlobalRetentionCheckpoint } from "../checkpoint/global-retention-checkpoint.js";
import { RetentionSegment, newRetentionSegment } from "./retention-segment.js";

export function summarizeGlobalRetentionCheckpointsForSegment(items: GlobalRetentionCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRetentionSegmentsFromCheckpoint(items: GlobalRetentionCheckpoint[]): RetentionSegment[] {
  const out: RetentionSegment[] = [];
  for (const item of items) {
    const derived = newRetentionSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateRetentionSegment(item: RetentionSegment): string {
  return globalRetentionCheckpointBucket(item.projectedVolume());
}
