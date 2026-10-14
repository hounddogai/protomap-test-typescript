import { ExitRuleAssignment } from "../../exit-rule/review/exit-rule-assignment.js";
import { exitRuleSummaryBucket } from "../../exit-rule/review/exit-rule-summary-policy.js";
import { WeightedEnrollmentCycle, newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

export function summarizeExitRuleAssignmentsForCycle(items: ExitRuleAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWeightedEnrollmentCyclesFromAssignment(items: ExitRuleAssignment[]): WeightedEnrollmentCycle[] {
  const out: WeightedEnrollmentCycle[] = [];
  for (const item of items) {
    const derived = newWeightedEnrollmentCycle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedEnrollmentCycle(item: WeightedEnrollmentCycle): string {
  return exitRuleSummaryBucket(item.weightedExposure());
}
