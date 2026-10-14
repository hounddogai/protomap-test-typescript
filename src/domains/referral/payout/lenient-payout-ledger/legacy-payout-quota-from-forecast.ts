import { adaptiveLeaderboardBaselineWeight } from "../../leaderboard/entry/adaptive-leaderboard-baseline-policy.js";
import { LeaderboardForecast } from "../../leaderboard/entry/leaderboard-forecast.js";
import { LegacyPayoutQuota, newLegacyPayoutQuota } from "./legacy-payout-quota.js";

export function summarizeLeaderboardForecastsForQuota(items: LeaderboardForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLegacyPayoutQuotasFromForecast(items: LeaderboardForecast[]): LegacyPayoutQuota[] {
  const out: LegacyPayoutQuota[] = [];
  for (const item of items) {
    const derived = newLegacyPayoutQuota(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyPayoutQuota(item: LegacyPayoutQuota): number {
  return adaptiveLeaderboardBaselineWeight(4, true);
}
