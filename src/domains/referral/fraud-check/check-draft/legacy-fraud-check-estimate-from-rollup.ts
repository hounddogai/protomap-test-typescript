import { classifySeasonalLeaderboardRollup } from "../../leaderboard/group/seasonal-leaderboard-rollup-policy.js";
import { SeasonalLeaderboardRollup } from "../../leaderboard/group/seasonal-leaderboard-rollup.js";
import { LegacyFraudCheckEstimate, newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

export function summarizeSeasonalLeaderboardRollupsForEstimate(items: SeasonalLeaderboardRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyFraudCheckEstimatesFromRollup(items: SeasonalLeaderboardRollup[]): LegacyFraudCheckEstimate[] {
  const out: LegacyFraudCheckEstimate[] = [];
  for (const item of items) {
    const derived = newLegacyFraudCheckEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeLegacyFraudCheckEstimate(item: LegacyFraudCheckEstimate): string {
  return classifySeasonalLeaderboardRollup(item.netVolume());
}
