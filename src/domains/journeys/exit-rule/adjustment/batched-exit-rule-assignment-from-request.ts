import { CappedEnrollmentRequest } from "../../enrollment/enrollment-estimate/capped-enrollment-request.js";
import {
  manualEnrollmentPreferenceWeight,
} from "../../enrollment/enrollment-estimate/manual-enrollment-preference-policy.js";
import { BatchedExitRuleAssignment, newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

export function summarizeCappedEnrollmentRequestsForAssignment(items: CappedEnrollmentRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBatchedExitRuleAssignmentsFromRequest(items: CappedEnrollmentRequest[]): BatchedExitRuleAssignment[] {
  const out: BatchedExitRuleAssignment[] = [];
  for (const item of items) {
    const derived = newBatchedExitRuleAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedExitRuleAssignment(item: BatchedExitRuleAssignment): number {
  return manualEnrollmentPreferenceWeight(6, true);
}
