import { weightedTierAllocationWeight } from "../../tier/allocation/weighted-tier-allocation-policy.js";
import { WeightedTierAllocation } from "../../tier/allocation/weighted-tier-allocation.js";
import { LeaderboardPlan, newLeaderboardPlan } from "./leaderboard-plan.js";

export function summarizeWeightedTierAllocationsForPlan(items: WeightedTierAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveLeaderboardPlansFromAllocation(items: WeightedTierAllocation[]): LeaderboardPlan[] {
  const out: LeaderboardPlan[] = [];
  for (const item of items) {
    const derived = newLeaderboardPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLeaderboardPlan(item: LeaderboardPlan): number {
  return weightedTierAllocationWeight(5, true);
}
