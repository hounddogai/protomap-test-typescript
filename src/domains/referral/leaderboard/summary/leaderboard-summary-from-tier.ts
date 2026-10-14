import { classifyInviteTemplate } from "../../invite/allocation/invite-template-policy.js";
import { InviteTier } from "../../invite/allocation/invite-tier.js";
import { LeaderboardSummary, newLeaderboardSummary } from "./leaderboard-summary.js";

export function summarizeInviteTiersForSummary(items: InviteTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLeaderboardSummariesFromTier(items: InviteTier[]): LeaderboardSummary[] {
  const out: LeaderboardSummary[] = [];
  for (const item of items) {
    const derived = newLeaderboardSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLeaderboardSummary(item: LeaderboardSummary): string {
  return classifyInviteTemplate(item.projectedValue());
}
