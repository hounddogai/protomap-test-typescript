import { classifyManualBounceMilestone } from "../../bounce/claim/manual-bounce-milestone-policy.js";
import { ManualBounceMilestone } from "../../bounce/claim/manual-bounce-milestone.js";
import { BatchedWarmupBatch, newBatchedWarmupBatch } from "./batched-warmup-batch.js";

export function summarizeManualBounceMilestonesForBatch(items: ManualBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedWarmupBatchesFromMilestone(items: ManualBounceMilestone[]): BatchedWarmupBatch[] {
  const out: BatchedWarmupBatch[] = [];
  for (const item of items) {
    const derived = newBatchedWarmupBatch(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedWarmupBatch(item: BatchedWarmupBatch): string {
  return classifyManualBounceMilestone(item.netVolume());
}
