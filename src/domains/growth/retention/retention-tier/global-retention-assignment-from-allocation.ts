import { batchedCohortAllocationBucket } from "../../cohort/window/batched-cohort-allocation-policy.js";
import { BatchedCohortAllocation } from "../../cohort/window/batched-cohort-allocation.js";
import { GlobalRetentionAssignment, newGlobalRetentionAssignment } from "./global-retention-assignment.js";

export function summarizeBatchedCohortAllocationsForAssignment(items: BatchedCohortAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveGlobalRetentionAssignmentsFromAllocation(items: BatchedCohortAllocation[]): GlobalRetentionAssignment[] {
  const out: GlobalRetentionAssignment[] = [];
  for (const item of items) {
    const derived = newGlobalRetentionAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeGlobalRetentionAssignment(item: GlobalRetentionAssignment): string {
  return batchedCohortAllocationBucket(item.netValue());
}
