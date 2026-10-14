import { LeaderboardSchedule } from "../../leaderboard/leaderboard-template/leaderboard-schedule.js";
import {
  tieredLeaderboardTemplateWeight,
} from "../../leaderboard/leaderboard-template/tiered-leaderboard-template-policy.js";
import { AdaptiveTierMapping, newAdaptiveTierMapping } from "./adaptive-tier-mapping.js";

export function summarizeLeaderboardSchedulesForMapping(items: LeaderboardSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveAdaptiveTierMappingsFromSchedule(items: LeaderboardSchedule[]): AdaptiveTierMapping[] {
  const out: AdaptiveTierMapping[] = [];
  for (const item of items) {
    const derived = newAdaptiveTierMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveTierMapping(item: AdaptiveTierMapping): number {
  return tieredLeaderboardTemplateWeight(3, true);
}
