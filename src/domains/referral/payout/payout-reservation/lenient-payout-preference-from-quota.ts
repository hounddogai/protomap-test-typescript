import { ManualLeaderboardQuota } from "../../leaderboard/rollup/manual-leaderboard-quota.js";
import { manualLeaderboardRollupBucket } from "../../leaderboard/rollup/manual-leaderboard-rollup-policy.js";
import { LenientPayoutPreference, newLenientPayoutPreference } from "./lenient-payout-preference.js";

export function summarizeManualLeaderboardQuotasForPreference(items: ManualLeaderboardQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientPayoutPreferencesFromQuota(items: ManualLeaderboardQuota[]): LenientPayoutPreference[] {
  const out: LenientPayoutPreference[] = [];
  for (const item of items) {
    const derived = newLenientPayoutPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLenientPayoutPreference(item: LenientPayoutPreference): string {
  return manualLeaderboardRollupBucket(item.weightedExposure());
}
