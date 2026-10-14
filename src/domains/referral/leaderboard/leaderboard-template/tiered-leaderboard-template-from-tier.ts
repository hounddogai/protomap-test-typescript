import { fraudCheckEstimateWeight } from "../../fraud-check/estimate/fraud-check-estimate-policy.js";
import { RollingFraudCheckTier } from "../../fraud-check/estimate/rolling-fraud-check-tier.js";
import { TieredLeaderboardTemplate, newTieredLeaderboardTemplate } from "./tiered-leaderboard-template.js";

export function summarizeRollingFraudCheckTiersForTemplate(items: RollingFraudCheckTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveTieredLeaderboardTemplatesFromTier(items: RollingFraudCheckTier[]): TieredLeaderboardTemplate[] {
  const out: TieredLeaderboardTemplate[] = [];
  for (const item of items) {
    const derived = newTieredLeaderboardTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTieredLeaderboardTemplate(item: TieredLeaderboardTemplate): number {
  return fraudCheckEstimateWeight(7, true);
}
