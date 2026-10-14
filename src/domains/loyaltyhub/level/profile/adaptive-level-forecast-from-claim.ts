import { StreakClaim } from "../../streak/target/streak-claim.js";
import { normalizeStreakEntryCode } from "../../streak/target/streak-entry-policy.js";
import { AdaptiveLevelForecast, newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

export function summarizeStreakClaimsForForecast(items: StreakClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveAdaptiveLevelForecastsFromClaim(items: StreakClaim[]): AdaptiveLevelForecast[] {
  const out: AdaptiveLevelForecast[] = [];
  for (const item of items) {
    const derived = newAdaptiveLevelForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyAdaptiveLevelForecast(item: AdaptiveLevelForecast): string {
  return normalizeStreakEntryCode(item.code);
}
