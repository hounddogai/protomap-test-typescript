import { manualLeaderboardCheckpointWeight } from "../../leaderboard/audit/manual-leaderboard-checkpoint-policy.js";
import { ManualLeaderboardCheckpoint } from "../../leaderboard/audit/manual-leaderboard-checkpoint.js";
import { TieredFraudCheckPolicy, newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

export function summarizeManualLeaderboardCheckpointsForPolicy(items: ManualLeaderboardCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveTieredFraudCheckPoliciesFromCheckpoint(items: ManualLeaderboardCheckpoint[]): TieredFraudCheckPolicy[] {
  const out: TieredFraudCheckPolicy[] = [];
  for (const item of items) {
    const derived = newTieredFraudCheckPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectTieredFraudCheckPolicy(item: TieredFraudCheckPolicy): number {
  return manualLeaderboardCheckpointWeight(6, true);
}
