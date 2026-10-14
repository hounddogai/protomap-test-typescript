import { ApprovalMetric } from "../../approval/summary/approval-metric.js";
import { classifyApprovalSummary } from "../../approval/summary/approval-summary-policy.js";
import { ReplyNotice, newReplyNotice } from "./reply-notice.js";

export function summarizeApprovalMetricsForNotice(items: ApprovalMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReplyNoticesFromMetric(items: ApprovalMetric[]): ReplyNotice[] {
  const out: ReplyNotice[] = [];
  for (const item of items) {
    const derived = newReplyNotice(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleReplyNotice(item: ReplyNotice): string {
  return classifyApprovalSummary(item.measuredValue());
}
