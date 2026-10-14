import { classifyBatchedCohortOverride } from "../override-item/batched-cohort-override-policy.js";
import { BatchedCohortOverride } from "../override-item/batched-cohort-override.js";
import { CohortSnapshot, newCohortSnapshot } from "./cohort-snapshot.js";

export function summarizeBatchedCohortOverridesForSnapshot(items: BatchedCohortOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortSnapshotsFromOverride(items: BatchedCohortOverride[]): CohortSnapshot[] {
  const out: CohortSnapshot[] = [];
  for (const item of items) {
    const derived = newCohortSnapshot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignCohortSnapshot(item: CohortSnapshot): string {
  return classifyBatchedCohortOverride(item.netLoad());
}
