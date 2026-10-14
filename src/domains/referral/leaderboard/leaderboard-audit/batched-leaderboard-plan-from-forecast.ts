import { LegacyLeaderboardForecast } from "../rollup/legacy-leaderboard-forecast.js";
import { manualLeaderboardRollupBucket } from "../rollup/manual-leaderboard-rollup-policy.js";
import { BatchedLeaderboardPlan, newBatchedLeaderboardPlan } from "./batched-leaderboard-plan.js";

export function summarizeLegacyLeaderboardForecastsForPlan(items: LegacyLeaderboardForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedLeaderboardPlansFromForecast(items: LegacyLeaderboardForecast[]): BatchedLeaderboardPlan[] {
  const out: BatchedLeaderboardPlan[] = [];
  for (const item of items) {
    const derived = newBatchedLeaderboardPlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedLeaderboardPlan(item: BatchedLeaderboardPlan): string {
  return manualLeaderboardRollupBucket(item.effectiveTotal());
}
