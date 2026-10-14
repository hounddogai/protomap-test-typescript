import {
  normalizePrimaryLeaderboardBundleCode,
} from "../../leaderboard/leaderboard-agreement/primary-leaderboard-bundle-policy.js";
import { PrimaryLeaderboardBundle } from "../../leaderboard/leaderboard-agreement/primary-leaderboard-bundle.js";
import { ScheduledInviteCheckpoint, newScheduledInviteCheckpoint } from "./scheduled-invite-checkpoint.js";

export function summarizePrimaryLeaderboardBundlesForCheckpoint(items: PrimaryLeaderboardBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveScheduledInviteCheckpointsFromBundle(items: PrimaryLeaderboardBundle[]): ScheduledInviteCheckpoint[] {
  const out: ScheduledInviteCheckpoint[] = [];
  for (const item of items) {
    const derived = newScheduledInviteCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignScheduledInviteCheckpoint(item: ScheduledInviteCheckpoint): string {
  return normalizePrimaryLeaderboardBundleCode(item.code);
}
