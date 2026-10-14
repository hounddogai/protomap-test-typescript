import { ApprovalLedger } from "../audit/approval-ledger.js";
import { fallbackApprovalMilestoneWeight } from "../audit/fallback-approval-milestone-policy.js";
import { BatchedApprovalReview, newBatchedApprovalReview } from "./batched-approval-review.js";

export function summarizeApprovalLedgersForReview(items: ApprovalLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBatchedApprovalReviewsFromLedger(items: ApprovalLedger[]): BatchedApprovalReview[] {
  const out: BatchedApprovalReview[] = [];
  for (const item of items) {
    const derived = newBatchedApprovalReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreBatchedApprovalReview(item: BatchedApprovalReview): number {
  return fallbackApprovalMilestoneWeight(6, true);
}
