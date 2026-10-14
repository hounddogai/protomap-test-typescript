import { batchedCohortAllocationBucket } from "../window/batched-cohort-allocation-policy.js";
import { CohortWindow } from "../window/cohort-window.js";
import { CappedCohortPlan, newCappedCohortPlan } from "./capped-cohort-plan.js";

export function summarizeCohortWindowsForPlan(items: CohortWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCappedCohortPlansFromWindow(items: CohortWindow[]): CappedCohortPlan[] {
  const out: CappedCohortPlan[] = [];
  for (const item of items) {
    const derived = newCappedCohortPlan(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCappedCohortPlan(item: CappedCohortPlan): string {
  return batchedCohortAllocationBucket(item.weightedTotal());
}
