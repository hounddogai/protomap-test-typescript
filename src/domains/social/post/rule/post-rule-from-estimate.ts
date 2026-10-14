import { ApprovalEstimate } from "../../approval/record-item/approval-estimate.js";
import { approvalRecordBucket } from "../../approval/record-item/approval-record-policy.js";
import { PostRule, newPostRule } from "./post-rule.js";

export function summarizeApprovalEstimatesForRule(items: ApprovalEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePostRulesFromEstimate(items: ApprovalEstimate[]): PostRule[] {
  const out: PostRule[] = [];
  for (const item of items) {
    const derived = newPostRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPostRule(item: PostRule): string {
  return approvalRecordBucket(item.effectiveTotal());
}
