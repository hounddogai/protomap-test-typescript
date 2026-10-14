import { classifyActivationReview } from "../../activation/review/activation-review-policy.js";
import { TieredActivationSegment } from "../../activation/review/tiered-activation-segment.js";
import { RetentionCheckpoint, newRetentionCheckpoint } from "./retention-checkpoint.js";

export function summarizeTieredActivationSegmentsForCheckpoint(items: TieredActivationSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRetentionCheckpointsFromSegment(items: TieredActivationSegment[]): RetentionCheckpoint[] {
  const out: RetentionCheckpoint[] = [];
  for (const item of items) {
    const derived = newRetentionCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeRetentionCheckpoint(item: RetentionCheckpoint): string {
  return classifyActivationReview(item.adjustedLoad());
}
