import { classifyWeightedRewardReview } from "../../reward/reward-estimate/weighted-reward-review-policy.js";
import { WeightedRewardReview } from "../../reward/reward-estimate/weighted-reward-review.js";
import { LevelBaseline, newLevelBaseline } from "./level-baseline.js";

export function summarizeWeightedRewardReviewsForBaseline(items: WeightedRewardReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveLevelBaselinesFromReview(items: WeightedRewardReview[]): LevelBaseline[] {
  const out: LevelBaseline[] = [];
  for (const item of items) {
    const derived = newLevelBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLevelBaseline(item: LevelBaseline): string {
  return classifyWeightedRewardReview(item.netExposure());
}
