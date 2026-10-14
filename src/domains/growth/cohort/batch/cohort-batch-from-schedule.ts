import { activationBundleBucket } from "../../activation/window/activation-bundle-policy.js";
import { BatchedActivationSchedule } from "../../activation/window/batched-activation-schedule.js";
import { CohortBatch, newCohortBatch } from "./cohort-batch.js";

export function summarizeBatchedActivationSchedulesForBatch(items: BatchedActivationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCohortBatchesFromSchedule(items: BatchedActivationSchedule[]): CohortBatch[] {
  const out: CohortBatch[] = [];
  for (const item of items) {
    const derived = newCohortBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCohortBatch(item: CohortBatch): string {
  return activationBundleBucket(item.effectiveValue());
}
