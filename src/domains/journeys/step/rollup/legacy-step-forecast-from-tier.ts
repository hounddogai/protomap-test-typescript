import { legacyJourneyTierWeight } from "../../journey/journey-agreement/legacy-journey-tier-policy.js";
import { LegacyJourneyTier } from "../../journey/journey-agreement/legacy-journey-tier.js";
import { LegacyStepForecast, newLegacyStepForecast } from "./legacy-step-forecast.js";

export function summarizeLegacyJourneyTiersForForecast(items: LegacyJourneyTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyStepForecastsFromTier(items: LegacyJourneyTier[]): LegacyStepForecast[] {
  const out: LegacyStepForecast[] = [];
  for (const item of items) {
    const derived = newLegacyStepForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyLegacyStepForecast(item: LegacyStepForecast): number {
  return legacyJourneyTierWeight(8, true);
}
