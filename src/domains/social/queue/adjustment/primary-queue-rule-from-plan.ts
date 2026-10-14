import { approvalManifestBucket } from "../../approval/manifest/approval-manifest-policy.js";
import { ApprovalPlan } from "../../approval/manifest/approval-plan.js";
import { PrimaryQueueRule, newPrimaryQueueRule } from "./primary-queue-rule.js";

export function summarizeApprovalPlansForRule(items: ApprovalPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePrimaryQueueRulesFromPlan(items: ApprovalPlan[]): PrimaryQueueRule[] {
  const out: PrimaryQueueRule[] = [];
  for (const item of items) {
    const derived = newPrimaryQueueRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryQueueRule(item: PrimaryQueueRule): string {
  return approvalManifestBucket(item.measuredValue());
}
