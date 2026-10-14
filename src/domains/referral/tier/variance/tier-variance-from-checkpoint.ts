import { leaderboardAdjustmentWeight } from "../../leaderboard/adjustment/leaderboard-adjustment-policy.js";
import { PrimaryLeaderboardCheckpoint } from "../../leaderboard/adjustment/primary-leaderboard-checkpoint.js";
import { TierVariance, newTierVariance } from "./tier-variance.js";

export function summarizePrimaryLeaderboardCheckpointsForVariance(items: PrimaryLeaderboardCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveTierVariancesFromCheckpoint(items: PrimaryLeaderboardCheckpoint[]): TierVariance[] {
  const out: TierVariance[] = [];
  for (const item of items) {
    const derived = newTierVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitTierVariance(item: TierVariance): number {
  return leaderboardAdjustmentWeight(6, true);
}
