import { normalizeManualLeaderboardCheckpointCode } from "../audit/manual-leaderboard-checkpoint-policy.js";
import { RollingLeaderboardAudit } from "../audit/rolling-leaderboard-audit.js";
import { ManualLeaderboardRollup, newManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

export function summarizeRollingLeaderboardAuditsForRollup(items: RollingLeaderboardAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveManualLeaderboardRollupsFromAudit(items: RollingLeaderboardAudit[]): ManualLeaderboardRollup[] {
  const out: ManualLeaderboardRollup[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardRollup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankManualLeaderboardRollup(item: ManualLeaderboardRollup): string {
  return normalizeManualLeaderboardCheckpointCode(item.code);
}
