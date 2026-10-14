import { inviteCycleBucket } from "../../invite/assignment/invite-cycle-policy.js";
import { InviteCycle } from "../../invite/assignment/invite-cycle.js";
import { LeaderboardMapping, newLeaderboardMapping } from "./leaderboard-mapping.js";

export function summarizeInviteCyclesForMapping(items: InviteCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLeaderboardMappingsFromCycle(items: InviteCycle[]): LeaderboardMapping[] {
  const out: LeaderboardMapping[] = [];
  for (const item of items) {
    const derived = newLeaderboardMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchLeaderboardMappingExtra(item: LeaderboardMapping): string {
  return inviteCycleBucket(item.projectedLoad());
}
