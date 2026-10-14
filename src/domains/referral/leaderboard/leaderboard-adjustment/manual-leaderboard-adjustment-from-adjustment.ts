import { PrimaryLeaderboardAdjustment } from "../adjustment/primary-leaderboard-adjustment.js";
import { normalizePrimaryLeaderboardCheckpointCode } from "../adjustment/primary-leaderboard-checkpoint-policy.js";
import { ManualLeaderboardAdjustment, newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

export function summarizePrimaryLeaderboardAdjustmentsForAdjustment(items: PrimaryLeaderboardAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveManualLeaderboardAdjustmentsFromAdjustment(items: PrimaryLeaderboardAdjustment[]): ManualLeaderboardAdjustment[] {
  const out: ManualLeaderboardAdjustment[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeManualLeaderboardAdjustment(item: ManualLeaderboardAdjustment): string {
  return normalizePrimaryLeaderboardCheckpointCode(item.code);
}
