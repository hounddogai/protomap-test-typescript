import { fallbackPayoutQuotaBucket } from "../../payout/cycle/fallback-payout-quota-policy.js";
import { FallbackPayoutQuota } from "../../payout/cycle/fallback-payout-quota.js";
import { TieredLeaderboardPlan, newTieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

export function summarizeFallbackPayoutQuotasForPlan(items: FallbackPayoutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredLeaderboardPlansFromQuota(items: FallbackPayoutQuota[]): TieredLeaderboardPlan[] {
  const out: TieredLeaderboardPlan[] = [];
  for (const item of items) {
    const derived = newTieredLeaderboardPlan(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTieredLeaderboardPlan(item: TieredLeaderboardPlan): string {
  return fallbackPayoutQuotaBucket(item.adjustedExposure());
}
