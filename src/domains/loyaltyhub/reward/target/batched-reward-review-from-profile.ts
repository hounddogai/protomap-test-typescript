import { seasonalBadgeSlotBucket } from "../../badge/weighted-badge-profile/seasonal-badge-slot-policy.js";
import { TieredBadgeProfile } from "../../badge/weighted-badge-profile/tiered-badge-profile.js";
import { BatchedRewardReview, newBatchedRewardReview } from "./batched-reward-review.js";

export function summarizeTieredBadgeProfilesForReview(items: TieredBadgeProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveBatchedRewardReviewsFromProfile(items: TieredBadgeProfile[]): BatchedRewardReview[] {
  const out: BatchedRewardReview[] = [];
  for (const item of items) {
    const derived = newBatchedRewardReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignBatchedRewardReview(item: BatchedRewardReview): string {
  return seasonalBadgeSlotBucket(item.projectedValue());
}
