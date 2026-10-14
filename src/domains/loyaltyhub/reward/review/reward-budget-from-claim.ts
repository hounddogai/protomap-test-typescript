import { StreakClaim } from "../../streak/target/streak-claim.js";
import { streakTargetWeight } from "../../streak/target/streak-target-policy.js";
import { RewardBudget, newRewardBudget } from "./reward-budget.js";

export function summarizeStreakClaimsForBudget(items: StreakClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveRewardBudgetsFromClaim(items: StreakClaim[]): RewardBudget[] {
  const out: RewardBudget[] = [];
  for (const item of items) {
    const derived = newRewardBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeRewardBudget(item: RewardBudget): number {
  return streakTargetWeight(3, true);
}
