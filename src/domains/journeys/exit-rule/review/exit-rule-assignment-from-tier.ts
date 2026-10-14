import { stepAuditBucket } from "../../step/notice/step-audit-policy.js";
import { StepTier } from "../../step/notice/step-tier.js";
import { ExitRuleAssignment, newExitRuleAssignment } from "./exit-rule-assignment.js";

export function summarizeStepTiersForAssignment(items: StepTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveExitRuleAssignmentsFromTier(items: StepTier[]): ExitRuleAssignment[] {
  const out: ExitRuleAssignment[] = [];
  for (const item of items) {
    const derived = newExitRuleAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planExitRuleAssignment(item: ExitRuleAssignment): string {
  return stepAuditBucket(item.effectiveLoad());
}
