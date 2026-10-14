import { stepAuditBucket } from "../../step/notice/step-audit-policy.js";
import { StepAudit } from "../../step/notice/step-audit.js";
import { BranchPolicy, newBranchPolicy } from "./branch-policy.js";

export function summarizeStepAuditsForPolicy(items: StepAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveBranchPoliciesFromAudit(items: StepAudit[]): BranchPolicy[] {
  const out: BranchPolicy[] = [];
  for (const item of items) {
    const derived = newBranchPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBranchPolicy(item: BranchPolicy): string {
  return stepAuditBucket(item.netLoad());
}
