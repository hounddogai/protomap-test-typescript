import { classifyRedemptionBudget } from "../../redemption/profile/redemption-budget-policy.js";
import { RedemptionReview } from "../../redemption/profile/redemption-review.js";
import { DefaultLevelAdjustment, newDefaultLevelAdjustment } from "./default-level-adjustment.js";

export function summarizeRedemptionReviewsForAdjustment(items: RedemptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveDefaultLevelAdjustmentsFromReview(items: RedemptionReview[]): DefaultLevelAdjustment[] {
  const out: DefaultLevelAdjustment[] = [];
  for (const item of items) {
    const derived = newDefaultLevelAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignDefaultLevelAdjustment(item: DefaultLevelAdjustment): string {
  return classifyRedemptionBudget(item.netValue());
}
