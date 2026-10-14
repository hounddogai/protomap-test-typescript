import { bidRuleTierWeight } from "../../bid-rule/plan/bid-rule-tier-policy.js";
import { BidRuleTier } from "../../bid-rule/plan/bid-rule-tier.js";
import { FallbackFlightMetric, newFallbackFlightMetric } from "./fallback-flight-metric.js";

export function summarizeBidRuleTiersForMetric(items: BidRuleTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveFallbackFlightMetricsFromTier(items: BidRuleTier[]): FallbackFlightMetric[] {
  const out: FallbackFlightMetric[] = [];
  for (const item of items) {
    const derived = newFallbackFlightMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFallbackFlightMetric(item: FallbackFlightMetric): number {
  return bidRuleTierWeight(5, true);
}
