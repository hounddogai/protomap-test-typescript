import { AdaptiveDomainMetric } from "../../domain/metric/adaptive-domain-metric.js";
import { defaultDomainThresholdWeight } from "../../domain/metric/default-domain-threshold-policy.js";
import { FallbackReputationVariance, newFallbackReputationVariance } from "./fallback-reputation-variance.js";

export function summarizeAdaptiveDomainMetricsForVariance(items: AdaptiveDomainMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFallbackReputationVariancesFromMetric(items: AdaptiveDomainMetric[]): FallbackReputationVariance[] {
  const out: FallbackReputationVariance[] = [];
  for (const item of items) {
    const derived = newFallbackReputationVariance(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFallbackReputationVariance(item: FallbackReputationVariance): number {
  return defaultDomainThresholdWeight(4, true);
}
