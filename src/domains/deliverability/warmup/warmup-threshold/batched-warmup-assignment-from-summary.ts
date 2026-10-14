import { adaptiveBounceAdjustmentBucket } from "../../bounce/summary/adaptive-bounce-adjustment-policy.js";
import { BounceSummary } from "../../bounce/summary/bounce-summary.js";
import { BatchedWarmupAssignment, newBatchedWarmupAssignment } from "./batched-warmup-assignment.js";

export function summarizeBounceSummariesForAssignment(items: BounceSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBatchedWarmupAssignmentsFromSummary(items: BounceSummary[]): BatchedWarmupAssignment[] {
  const out: BatchedWarmupAssignment[] = [];
  for (const item of items) {
    const derived = newBatchedWarmupAssignment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedWarmupAssignment(item: BatchedWarmupAssignment): string {
  return adaptiveBounceAdjustmentBucket(item.netTotal());
}
