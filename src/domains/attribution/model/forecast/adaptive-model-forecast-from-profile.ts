import { strictWindowProfileBucket } from "../../window/profile/strict-window-profile-policy.js";
import { StrictWindowProfile } from "../../window/profile/strict-window-profile.js";
import { AdaptiveModelForecast, newAdaptiveModelForecast } from "./adaptive-model-forecast.js";

export function summarizeStrictWindowProfilesForForecast(items: StrictWindowProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptiveModelForecastsFromProfile(items: StrictWindowProfile[]): AdaptiveModelForecast[] {
  const out: AdaptiveModelForecast[] = [];
  for (const item of items) {
    const derived = newAdaptiveModelForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeAdaptiveModelForecast(item: AdaptiveModelForecast): string {
  return strictWindowProfileBucket(item.adjustedLoad());
}
