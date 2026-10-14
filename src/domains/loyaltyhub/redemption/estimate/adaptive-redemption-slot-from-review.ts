import { normalizeRewardMappingCode } from "../../reward/reward-estimate/reward-mapping-policy.js";
import { WeightedRewardReview } from "../../reward/reward-estimate/weighted-reward-review.js";
import { AdaptiveRedemptionSlot, newAdaptiveRedemptionSlot } from "./adaptive-redemption-slot.js";

export function summarizeWeightedRewardReviewsForSlot(items: WeightedRewardReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveAdaptiveRedemptionSlotsFromReview(items: WeightedRewardReview[]): AdaptiveRedemptionSlot[] {
  const out: AdaptiveRedemptionSlot[] = [];
  for (const item of items) {
    const derived = newAdaptiveRedemptionSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveRedemptionSlot(item: AdaptiveRedemptionSlot): string {
  return normalizeRewardMappingCode(item.code);
}
