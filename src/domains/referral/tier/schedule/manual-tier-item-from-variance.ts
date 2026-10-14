import { LeaderboardVariance } from "../../leaderboard/audit/leaderboard-variance.js";
import {
  normalizeManualLeaderboardCheckpointCode,
} from "../../leaderboard/audit/manual-leaderboard-checkpoint-policy.js";
import { ManualTierItem, newManualTierItem } from "./manual-tier-item.js";

export function summarizeLeaderboardVariancesForItem(items: LeaderboardVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualTierItemsFromVariance(items: LeaderboardVariance[]): ManualTierItem[] {
  const out: ManualTierItem[] = [];
  for (const item of items) {
    const derived = newManualTierItem(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveManualTierItem(item: ManualTierItem): string {
  return normalizeManualLeaderboardCheckpointCode(item.code);
}
