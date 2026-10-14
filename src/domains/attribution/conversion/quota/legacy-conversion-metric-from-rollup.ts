import { fallbackCreditTargetBucket } from "../../credit/summary/fallback-credit-target-policy.js";
import { ScheduledCreditRollup } from "../../credit/summary/scheduled-credit-rollup.js";
import { LegacyConversionMetric, newLegacyConversionMetric } from "./legacy-conversion-metric.js";

export function summarizeScheduledCreditRollupsForMetric(items: ScheduledCreditRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyConversionMetricsFromRollup(items: ScheduledCreditRollup[]): LegacyConversionMetric[] {
  const out: LegacyConversionMetric[] = [];
  for (const item of items) {
    const derived = newLegacyConversionMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLegacyConversionMetric(item: LegacyConversionMetric): string {
  return fallbackCreditTargetBucket(item.weightedLoad());
}
