import { DefaultInviteEntry } from "../../invite/scheduled-invite-entry/default-invite-entry.js";
import { pendingInvitePolicyWeight } from "../../invite/scheduled-invite-entry/pending-invite-policy-policy.js";
import { ManualLeaderboardMilestone, newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

export function summarizeDefaultInviteEntriesForMilestone(items: DefaultInviteEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveManualLeaderboardMilestonesFromEntry(items: DefaultInviteEntry[]): ManualLeaderboardMilestone[] {
  const out: ManualLeaderboardMilestone[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualLeaderboardMilestone(item: ManualLeaderboardMilestone): number {
  return pendingInvitePolicyWeight(6, true);
}
