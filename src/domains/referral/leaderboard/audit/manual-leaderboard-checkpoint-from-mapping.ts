import { pendingLeaderboardMappingBucket } from "../override-item/pending-leaderboard-mapping-policy.js";
import { PendingLeaderboardMapping } from "../override-item/pending-leaderboard-mapping.js";
import { ManualLeaderboardCheckpoint, newManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

export function summarizePendingLeaderboardMappingsForCheckpoint(items: PendingLeaderboardMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveManualLeaderboardCheckpointsFromMapping(items: PendingLeaderboardMapping[]): ManualLeaderboardCheckpoint[] {
  const out: ManualLeaderboardCheckpoint[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualLeaderboardCheckpoint(item: ManualLeaderboardCheckpoint): string {
  return pendingLeaderboardMappingBucket(item.effectiveTotal());
}
