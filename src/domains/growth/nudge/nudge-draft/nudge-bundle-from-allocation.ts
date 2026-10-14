import { batchedCohortAllocationBucket } from "../../cohort/window/batched-cohort-allocation-policy.js";
import { BatchedCohortAllocation } from "../../cohort/window/batched-cohort-allocation.js";
import { NudgeBundle, newNudgeBundle } from "./nudge-bundle.js";

export function summarizeBatchedCohortAllocationsForBundle(items: BatchedCohortAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveNudgeBundlesFromAllocation(items: BatchedCohortAllocation[]): NudgeBundle[] {
  const out: NudgeBundle[] = [];
  for (const item of items) {
    const derived = newNudgeBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeNudgeBundle(item: NudgeBundle): string {
  return batchedCohortAllocationBucket(item.weightedLoad());
}
