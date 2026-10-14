import { InviteRollup } from "../../invite/window/invite-rollup.js";
import { inviteWindowWeight } from "../../invite/window/invite-window-policy.js";
import { LeaderboardAllocation, newLeaderboardAllocation } from "./leaderboard-allocation.js";

export function summarizeInviteRollupsForAllocation(items: InviteRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLeaderboardAllocationsFromRollup(items: InviteRollup[]): LeaderboardAllocation[] {
  const out: LeaderboardAllocation[] = [];
  for (const item of items) {
    const derived = newLeaderboardAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleLeaderboardAllocation(item: LeaderboardAllocation): number {
  return inviteWindowWeight(5, true);
}
