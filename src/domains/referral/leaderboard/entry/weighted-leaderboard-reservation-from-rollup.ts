import { classifyManualTierRule } from "../../tier/budget/manual-tier-rule-policy.js";
import { RollingTierRollup } from "../../tier/budget/rolling-tier-rollup.js";
import {
  WeightedLeaderboardReservation,
  newWeightedLeaderboardReservation,
} from "./weighted-leaderboard-reservation.js";

export function summarizeRollingTierRollupsForReservation(items: RollingTierRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWeightedLeaderboardReservationsFromRollup(items: RollingTierRollup[]): WeightedLeaderboardReservation[] {
  const out: WeightedLeaderboardReservation[] = [];
  for (const item of items) {
    const derived = newWeightedLeaderboardReservation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankWeightedLeaderboardReservation(item: WeightedLeaderboardReservation): string {
  return classifyManualTierRule(item.effectiveValue());
}
