import { LeaderboardGroup } from "../../leaderboard/group/leaderboard-group.js";
import { classifySeasonalLeaderboardRollup } from "../../leaderboard/group/seasonal-leaderboard-rollup-policy.js";
import { InviteNotice, newInviteNotice } from "./invite-notice.js";

export function summarizeLeaderboardGroupsForNotice(items: LeaderboardGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveInviteNoticesFromGroup(items: LeaderboardGroup[]): InviteNotice[] {
  const out: InviteNotice[] = [];
  for (const item of items) {
    const derived = newInviteNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeInviteNotice(item: InviteNotice): string {
  return classifySeasonalLeaderboardRollup(item.effectiveLoad());
}
