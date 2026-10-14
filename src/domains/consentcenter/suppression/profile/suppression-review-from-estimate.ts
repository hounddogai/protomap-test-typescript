import { subscriptionEstimateBucket } from "../../subscription/window/subscription-estimate-policy.js";
import { SubscriptionEstimate } from "../../subscription/window/subscription-estimate.js";
import { SuppressionReview, newSuppressionReview } from "./suppression-review.js";

export function summarizeSubscriptionEstimatesForReview(items: SubscriptionEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveSuppressionReviewsFromEstimate(items: SubscriptionEstimate[]): SuppressionReview[] {
  const out: SuppressionReview[] = [];
  for (const item of items) {
    const derived = newSuppressionReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSuppressionReview(item: SuppressionReview): string {
  return subscriptionEstimateBucket(item.projectedValue());
}
