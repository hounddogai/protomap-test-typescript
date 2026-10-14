import { fallbackRewardRequestBucket } from "../adjustment/fallback-reward-request-policy.js";
import { RewardAdjustment } from "../adjustment/reward-adjustment.js";
import { SeasonalRewardBudget, newSeasonalRewardBudget } from "./seasonal-reward-budget.js";

export function summarizeRewardAdjustmentsForBudget(items: RewardAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveSeasonalRewardBudgetsFromAdjustment(items: RewardAdjustment[]): SeasonalRewardBudget[] {
  const out: SeasonalRewardBudget[] = [];
  for (const item of items) {
    const derived = newSeasonalRewardBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applySeasonalRewardBudget(item: SeasonalRewardBudget): string {
  return fallbackRewardRequestBucket(item.effectiveExposure());
}
