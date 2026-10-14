import { branchGroupWeight } from "../../branch/policy/branch-group-policy.js";
import { FallbackBranchPlan } from "../../branch/policy/fallback-branch-plan.js";
import { WeightedEnrollmentCycle, newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

export function summarizeFallbackBranchPlansForCycle(items: FallbackBranchPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveWeightedEnrollmentCyclesFromPlan(items: FallbackBranchPlan[]): WeightedEnrollmentCycle[] {
  const out: WeightedEnrollmentCycle[] = [];
  for (const item of items) {
    const derived = newWeightedEnrollmentCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWeightedEnrollmentCycle(item: WeightedEnrollmentCycle): number {
  return branchGroupWeight(3, true);
}
