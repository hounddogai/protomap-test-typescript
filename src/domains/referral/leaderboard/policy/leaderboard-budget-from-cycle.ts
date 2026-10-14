import { tierCycleWeight } from "../../tier/lenient-tier-record/tier-cycle-policy.js";
import { TierCycle } from "../../tier/lenient-tier-record/tier-cycle.js";
import { LeaderboardBudget, newLeaderboardBudget } from "./leaderboard-budget.js";

export function summarizeTierCyclesForBudget(items: TierCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLeaderboardBudgetsFromCycle(items: TierCycle[]): LeaderboardBudget[] {
  const out: LeaderboardBudget[] = [];
  for (const item of items) {
    const derived = newLeaderboardBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLeaderboardBudget(item: LeaderboardBudget): number {
  return tierCycleWeight(1, true);
}
