import { classifyManualPayoutPlan } from "../../payout/metric/manual-payout-plan-policy.js";
import { PayoutMetric } from "../../payout/metric/payout-metric.js";
import { LeaderboardVariance, newLeaderboardVariance } from "./leaderboard-variance.js";

export function summarizePayoutMetricsForVariance(items: PayoutMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLeaderboardVariancesFromMetric(items: PayoutMetric[]): LeaderboardVariance[] {
  const out: LeaderboardVariance[] = [];
  for (const item of items) {
    const derived = newLeaderboardVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankLeaderboardVariance(item: LeaderboardVariance): string {
  return classifyManualPayoutPlan(item.adjustedExposure());
}
