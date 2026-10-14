import { enrollmentPlanWeight } from "../../enrollment/estimate/enrollment-plan-policy.js";
import { EnrollmentPlan } from "../../enrollment/estimate/enrollment-plan.js";
import { PendingBranchBaseline, newPendingBranchBaseline } from "./pending-branch-baseline.js";

export function summarizeEnrollmentPlansForBaseline(items: EnrollmentPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingBranchBaselinesFromPlan(items: EnrollmentPlan[]): PendingBranchBaseline[] {
  const out: PendingBranchBaseline[] = [];
  for (const item of items) {
    const derived = newPendingBranchBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePendingBranchBaseline(item: PendingBranchBaseline): number {
  return enrollmentPlanWeight(1, true);
}
