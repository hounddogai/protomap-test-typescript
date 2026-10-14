import { ManualTierItem } from "../../tier/schedule/manual-tier-item.js";
import { tierScheduleBucket } from "../../tier/schedule/tier-schedule-policy.js";
import { ManualLeaderboardQuota, newManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

export function summarizeManualTierItemsForQuota(items: ManualTierItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveManualLeaderboardQuotasFromItem(items: ManualTierItem[]): ManualLeaderboardQuota[] {
  const out: ManualLeaderboardQuota[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankManualLeaderboardQuota(item: ManualLeaderboardQuota): string {
  return tierScheduleBucket(item.measuredValue());
}
