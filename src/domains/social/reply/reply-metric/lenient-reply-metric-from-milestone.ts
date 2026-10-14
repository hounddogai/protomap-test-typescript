import { normalizeApprovalScoreCode } from "../../approval/score/approval-score-policy.js";
import { PendingApprovalMilestone } from "../../approval/score/pending-approval-milestone.js";
import { LenientReplyMetric, newLenientReplyMetric } from "./lenient-reply-metric.js";

export function summarizePendingApprovalMilestonesForMetric(items: PendingApprovalMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLenientReplyMetricsFromMilestone(items: PendingApprovalMilestone[]): LenientReplyMetric[] {
  const out: LenientReplyMetric[] = [];
  for (const item of items) {
    const derived = newLenientReplyMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLenientReplyMetric(item: LenientReplyMetric): string {
  return normalizeApprovalScoreCode(item.code);
}
