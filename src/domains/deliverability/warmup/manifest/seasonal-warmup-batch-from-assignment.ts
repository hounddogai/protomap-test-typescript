import { batchedWarmupAssignmentBucket } from "../warmup-threshold/batched-warmup-assignment-policy.js";
import { BatchedWarmupAssignment } from "../warmup-threshold/batched-warmup-assignment.js";
import { SeasonalWarmupBatch, newSeasonalWarmupBatch } from "./seasonal-warmup-batch.js";

export function summarizeBatchedWarmupAssignmentsForBatch(items: BatchedWarmupAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSeasonalWarmupBatchesFromAssignment(items: BatchedWarmupAssignment[]): SeasonalWarmupBatch[] {
  const out: SeasonalWarmupBatch[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupBatch(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planSeasonalWarmupBatch(item: SeasonalWarmupBatch): string {
  return batchedWarmupAssignmentBucket(item.netLoad());
}
