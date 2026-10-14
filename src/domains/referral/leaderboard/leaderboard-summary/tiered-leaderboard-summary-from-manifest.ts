import { PrimaryRewardRuleManifest } from "../../reward-rule/allocation/primary-reward-rule-manifest.js";
import {
  classifyTieredRewardRuleReservation,
} from "../../reward-rule/allocation/tiered-reward-rule-reservation-policy.js";
import { TieredLeaderboardSummary, newTieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

export function summarizePrimaryRewardRuleManifestsForSummary(items: PrimaryRewardRuleManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredLeaderboardSummariesFromManifest(items: PrimaryRewardRuleManifest[]): TieredLeaderboardSummary[] {
  const out: TieredLeaderboardSummary[] = [];
  for (const item of items) {
    const derived = newTieredLeaderboardSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTieredLeaderboardSummary(item: TieredLeaderboardSummary): string {
  return classifyTieredRewardRuleReservation(item.adjustedExposure());
}
