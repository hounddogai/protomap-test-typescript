import {
  fallbackSubscriptionQuotaBucket,
} from "../../subscription/subscription-cycle/fallback-subscription-quota-policy.js";
import { FallbackSubscriptionQuota } from "../../subscription/subscription-cycle/fallback-subscription-quota.js";
import { LegacyDoubleOptInForecast, newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

export function summarizeFallbackSubscriptionQuotasForForecast(items: FallbackSubscriptionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLegacyDoubleOptInForecastsFromQuota(items: FallbackSubscriptionQuota[]): LegacyDoubleOptInForecast[] {
  const out: LegacyDoubleOptInForecast[] = [];
  for (const item of items) {
    const derived = newLegacyDoubleOptInForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyLegacyDoubleOptInForecast(item: LegacyDoubleOptInForecast): string {
  return fallbackSubscriptionQuotaBucket(item.adjustedVolume());
}
