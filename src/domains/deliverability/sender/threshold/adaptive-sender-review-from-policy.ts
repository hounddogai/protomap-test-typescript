import { PrimaryWarmupPolicy } from "../../warmup/policy/primary-warmup-policy.js";
import { warmupQuotaWeight } from "../../warmup/policy/warmup-quota-policy.js";
import { AdaptiveSenderReview, newAdaptiveSenderReview } from "./adaptive-sender-review.js";

export function summarizePrimaryWarmupPoliciesForReview(items: PrimaryWarmupPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveAdaptiveSenderReviewsFromPolicy(items: PrimaryWarmupPolicy[]): AdaptiveSenderReview[] {
  const out: AdaptiveSenderReview[] = [];
  for (const item of items) {
    const derived = newAdaptiveSenderReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveSenderReview(item: AdaptiveSenderReview): number {
  return warmupQuotaWeight(5, true);
}
