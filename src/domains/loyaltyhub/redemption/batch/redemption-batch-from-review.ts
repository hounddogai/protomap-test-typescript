import { classifyRedemptionProfile } from "../profile/redemption-profile-policy.js";
import { RedemptionReview } from "../profile/redemption-review.js";
import { RedemptionBatch, newRedemptionBatch } from "./redemption-batch.js";

export function summarizeRedemptionReviewsForBatch(items: RedemptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRedemptionBatchesFromReview(items: RedemptionReview[]): RedemptionBatch[] {
  const out: RedemptionBatch[] = [];
  for (const item of items) {
    const derived = newRedemptionBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRedemptionBatch(item: RedemptionBatch): string {
  return classifyRedemptionProfile(item.projectedTotal());
}
