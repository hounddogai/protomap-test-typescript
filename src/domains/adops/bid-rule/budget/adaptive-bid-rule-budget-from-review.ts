import { RegionalPacingReview } from "../../pacing/slot/regional-pacing-review.js";
import { weightedPacingThresholdBucket } from "../../pacing/slot/weighted-pacing-threshold-policy.js";
import { AdaptiveBidRuleBudget, newAdaptiveBidRuleBudget } from "./adaptive-bid-rule-budget.js";

export function summarizeRegionalPacingReviewsForBudget(items: RegionalPacingReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptiveBidRuleBudgetsFromReview(items: RegionalPacingReview[]): AdaptiveBidRuleBudget[] {
  const out: AdaptiveBidRuleBudget[] = [];
  for (const item of items) {
    const derived = newAdaptiveBidRuleBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveBidRuleBudget(item: AdaptiveBidRuleBudget): string {
  return weightedPacingThresholdBucket(item.effectiveValue());
}
