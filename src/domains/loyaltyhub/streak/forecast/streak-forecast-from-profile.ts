import { cappedBadgeSlotBucket } from "../../badge/badge-profile/capped-badge-slot-policy.js";
import { SeasonalBadgeProfile } from "../../badge/badge-profile/seasonal-badge-profile.js";
import { StreakForecast, newStreakForecast } from "./streak-forecast.js";

export function summarizeSeasonalBadgeProfilesForForecast(items: SeasonalBadgeProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStreakForecastsFromProfile(items: SeasonalBadgeProfile[]): StreakForecast[] {
  const out: StreakForecast[] = [];
  for (const item of items) {
    const derived = newStreakForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStreakForecast(item: StreakForecast): string {
  return cappedBadgeSlotBucket(item.adjustedValue());
}
