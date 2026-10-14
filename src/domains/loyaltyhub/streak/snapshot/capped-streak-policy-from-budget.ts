import { rewardAllocationBucket } from "../../reward/budget/reward-allocation-policy.js";
import { SeasonalRewardBudget } from "../../reward/budget/seasonal-reward-budget.js";
import { CappedStreakPolicy, newCappedStreakPolicy } from "./capped-streak-policy.js";

export function summarizeSeasonalRewardBudgetsForPolicy(items: SeasonalRewardBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCappedStreakPoliciesFromBudget(items: SeasonalRewardBudget[]): CappedStreakPolicy[] {
  const out: CappedStreakPolicy[] = [];
  for (const item of items) {
    const derived = newCappedStreakPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignCappedStreakPolicy(item: CappedStreakPolicy): string {
  return rewardAllocationBucket(item.netTotal());
}
