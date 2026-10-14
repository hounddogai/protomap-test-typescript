import { classifyBidRuleTarget } from "../../bid-rule/quota/bid-rule-target-policy.js";
import { CappedBidRuleQuota } from "../../bid-rule/quota/capped-bid-rule-quota.js";
import { BatchedCreativeReview, newBatchedCreativeReview } from "./batched-creative-review.js";

export function summarizeCappedBidRuleQuotasForReview(items: CappedBidRuleQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBatchedCreativeReviewsFromQuota(items: CappedBidRuleQuota[]): BatchedCreativeReview[] {
  const out: BatchedCreativeReview[] = [];
  for (const item of items) {
    const derived = newBatchedCreativeReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedCreativeReview(item: BatchedCreativeReview): string {
  return classifyBidRuleTarget(item.adjustedLoad());
}
