import { SeasonalBadgeBudget } from "../../badge/budget/seasonal-badge-budget.js";
import { normalizeStrictBadgePlanCode } from "../../badge/budget/strict-badge-plan-policy.js";
import { ManualRewardReview, newManualRewardReview } from "./manual-reward-review.js";

export function summarizeSeasonalBadgeBudgetsForReview(items: SeasonalBadgeBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveManualRewardReviewsFromBudget(items: SeasonalBadgeBudget[]): ManualRewardReview[] {
  const out: ManualRewardReview[] = [];
  for (const item of items) {
    const derived = newManualRewardReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyManualRewardReview(item: ManualRewardReview): string {
  return normalizeStrictBadgePlanCode(item.code);
}
