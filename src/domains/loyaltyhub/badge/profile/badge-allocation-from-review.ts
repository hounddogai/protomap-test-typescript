import { rewardReviewWeight } from "../../reward/review/reward-review-policy.js";
import { RewardReview } from "../../reward/review/reward-review.js";
import { BadgeAllocation, newBadgeAllocation } from "./badge-allocation.js";

export function summarizeRewardReviewsForAllocation(items: RewardReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBadgeAllocationsFromReview(items: RewardReview[]): BadgeAllocation[] {
  const out: BadgeAllocation[] = [];
  for (const item of items) {
    const derived = newBadgeAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeBadgeAllocation(item: BadgeAllocation): number {
  return rewardReviewWeight(4, true);
}
