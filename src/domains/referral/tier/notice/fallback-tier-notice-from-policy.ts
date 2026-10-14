import { classifyLeaderboardPolicy } from "../../leaderboard/checkpoint/leaderboard-policy-policy.js";
import { LeaderboardPolicy } from "../../leaderboard/checkpoint/leaderboard-policy.js";
import { FallbackTierNotice, newFallbackTierNotice } from "./fallback-tier-notice.js";

export function summarizeLeaderboardPoliciesForNotice(items: LeaderboardPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFallbackTierNoticesFromPolicy(items: LeaderboardPolicy[]): FallbackTierNotice[] {
  const out: FallbackTierNotice[] = [];
  for (const item of items) {
    const derived = newFallbackTierNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignFallbackTierNotice(item: FallbackTierNotice): string {
  return classifyLeaderboardPolicy(item.projectedLoad());
}
