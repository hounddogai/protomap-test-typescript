import { PayoutPolicy } from "../../payout/policy/payout-policy.js";
import { scheduledPayoutNoticeBucket } from "../../payout/policy/scheduled-payout-notice-policy.js";
import { LeaderboardPlan, newLeaderboardPlan } from "./leaderboard-plan.js";

export function summarizePayoutPoliciesForPlan(items: PayoutPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLeaderboardPlansFromPolicy(items: PayoutPolicy[]): LeaderboardPlan[] {
  const out: LeaderboardPlan[] = [];
  for (const item of items) {
    const derived = newLeaderboardPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLeaderboardPlan(item: LeaderboardPlan): string {
  return scheduledPayoutNoticeBucket(item.projectedValue());
}
