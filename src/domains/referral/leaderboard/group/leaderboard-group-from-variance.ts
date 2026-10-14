import { PendingTierVariance } from "../../tier/lenient-tier-variance/pending-tier-variance.js";
import { classifyTieredTierCycle } from "../../tier/lenient-tier-variance/tiered-tier-cycle-policy.js";
import { LeaderboardGroup, newLeaderboardGroup } from "./leaderboard-group.js";

export function summarizePendingTierVariancesForGroup(items: PendingTierVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveLeaderboardGroupsFromVariance(items: PendingTierVariance[]): LeaderboardGroup[] {
  const out: LeaderboardGroup[] = [];
  for (const item of items) {
    const derived = newLeaderboardGroup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyLeaderboardGroup(item: LeaderboardGroup): string {
  return classifyTieredTierCycle(item.weightedVolume());
}
