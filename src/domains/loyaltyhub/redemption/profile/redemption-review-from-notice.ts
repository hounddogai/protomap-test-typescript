import { classifyStreakNotice } from "../../streak/plan/streak-notice-policy.js";
import { StreakNotice } from "../../streak/plan/streak-notice.js";
import { RedemptionReview, newRedemptionReview } from "./redemption-review.js";

export function summarizeStreakNoticesForReview(items: StreakNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRedemptionReviewsFromNotice(items: StreakNotice[]): RedemptionReview[] {
  const out: RedemptionReview[] = [];
  for (const item of items) {
    const derived = newRedemptionReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRedemptionReview(item: RedemptionReview): string {
  return classifyStreakNotice(item.weightedVolume());
}
