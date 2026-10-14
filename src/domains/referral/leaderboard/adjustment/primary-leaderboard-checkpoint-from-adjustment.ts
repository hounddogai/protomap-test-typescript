import { normalizeInviteAdjustmentCode } from "../../invite/invite-segment/invite-adjustment-policy.js";
import { InviteAdjustment } from "../../invite/invite-segment/invite-adjustment.js";
import { PrimaryLeaderboardCheckpoint, newPrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

export function summarizeInviteAdjustmentsForCheckpoint(items: InviteAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryLeaderboardCheckpointsFromAdjustment(items: InviteAdjustment[]): PrimaryLeaderboardCheckpoint[] {
  const out: PrimaryLeaderboardCheckpoint[] = [];
  for (const item of items) {
    const derived = newPrimaryLeaderboardCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPrimaryLeaderboardCheckpoint(item: PrimaryLeaderboardCheckpoint): string {
  return normalizeInviteAdjustmentCode(item.code);
}
