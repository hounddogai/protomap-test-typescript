import { classifyLegacyLeaderboardForecast } from "../../leaderboard/rollup/legacy-leaderboard-forecast-policy.js";
import { LegacyLeaderboardForecast } from "../../leaderboard/rollup/legacy-leaderboard-forecast.js";
import { FallbackRewardRuleRequest, newFallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

export function summarizeLegacyLeaderboardForecastsForRequest(items: LegacyLeaderboardForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFallbackRewardRuleRequestsFromForecast(items: LegacyLeaderboardForecast[]): FallbackRewardRuleRequest[] {
  const out: FallbackRewardRuleRequest[] = [];
  for (const item of items) {
    const derived = newFallbackRewardRuleRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeFallbackRewardRuleRequest(item: FallbackRewardRuleRequest): string {
  return classifyLegacyLeaderboardForecast(item.netValue());
}
