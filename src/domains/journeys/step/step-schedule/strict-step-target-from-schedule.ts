import { BranchSchedule } from "../../branch/branch-metric/branch-schedule.js";
import { cappedBranchMetricBucket } from "../../branch/branch-metric/capped-branch-metric-policy.js";
import { StrictStepTarget, newStrictStepTarget } from "./strict-step-target.js";

export function summarizeBranchSchedulesForTarget(items: BranchSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveStrictStepTargetsFromSchedule(items: BranchSchedule[]): StrictStepTarget[] {
  const out: StrictStepTarget[] = [];
  for (const item of items) {
    const derived = newStrictStepTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateStrictStepTarget(item: StrictStepTarget): string {
  return cappedBranchMetricBucket(item.effectiveValue());
}
