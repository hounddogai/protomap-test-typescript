import { ApprovalEstimate } from "../../approval/record-item/approval-estimate.js";
import { approvalRecordBucket } from "../../approval/record-item/approval-record-policy.js";
import { ReplyBaseline, newReplyBaseline } from "./reply-baseline.js";

export function summarizeApprovalEstimatesForBaseline(items: ApprovalEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveReplyBaselinesFromEstimate(items: ApprovalEstimate[]): ReplyBaseline[] {
  const out: ReplyBaseline[] = [];
  for (const item of items) {
    const derived = newReplyBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeReplyBaseline(item: ReplyBaseline): string {
  return approvalRecordBucket(item.weightedTotal());
}
