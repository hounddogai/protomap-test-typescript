import { TierAllocation } from "../../tier/entry/tier-allocation.js";
import { tierEntryBucket } from "../../tier/entry/tier-entry-policy.js";
import { LeaderboardCheckpoint, newLeaderboardCheckpoint } from "./leaderboard-checkpoint.js";

export function summarizeTierAllocationsForCheckpoint(items: TierAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLeaderboardCheckpointsFromAllocation(items: TierAllocation[]): LeaderboardCheckpoint[] {
  const out: LeaderboardCheckpoint[] = [];
  for (const item of items) {
    const derived = newLeaderboardCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignLeaderboardCheckpoint(item: LeaderboardCheckpoint): string {
  return tierEntryBucket(item.netLoad());
}
