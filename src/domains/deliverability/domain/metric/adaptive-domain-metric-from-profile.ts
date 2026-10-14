import { FallbackBounceProfile } from "../../bounce/cycle/fallback-bounce-profile.js";
import { legacyBounceForecastBucket } from "../../bounce/cycle/legacy-bounce-forecast-policy.js";
import { AdaptiveDomainMetric, newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

export function summarizeFallbackBounceProfilesForMetric(items: FallbackBounceProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveAdaptiveDomainMetricsFromProfile(items: FallbackBounceProfile[]): AdaptiveDomainMetric[] {
  const out: AdaptiveDomainMetric[] = [];
  for (const item of items) {
    const derived = newAdaptiveDomainMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveDomainMetricExtra(item: AdaptiveDomainMetric): string {
  return legacyBounceForecastBucket(item.projectedValue());
}
