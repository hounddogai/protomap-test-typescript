import { PendingLevelMilestone } from "../../level/milestone/pending-level-milestone.js";
import { classifyTieredLevelReservation } from "../../level/milestone/tiered-level-reservation-policy.js";
import { ChallengeForecast, newChallengeForecast } from "./challenge-forecast.js";

export function summarizePendingLevelMilestonesForForecast(items: PendingLevelMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveChallengeForecastsFromMilestone(items: PendingLevelMilestone[]): ChallengeForecast[] {
  const out: ChallengeForecast[] = [];
  for (const item of items) {
    const derived = newChallengeForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignChallengeForecast(item: ChallengeForecast): string {
  return classifyTieredLevelReservation(item.projectedExposure());
}
