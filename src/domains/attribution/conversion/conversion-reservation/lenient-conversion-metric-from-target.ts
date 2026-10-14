import { RollingTouchpointTarget } from "../../touchpoint/milestone/rolling-touchpoint-target.js";
import { normalizeTouchpointEstimateCode } from "../../touchpoint/milestone/touchpoint-estimate-policy.js";
import { LenientConversionMetric, newLenientConversionMetric } from "./lenient-conversion-metric.js";

export function summarizeRollingTouchpointTargetsForMetric(items: RollingTouchpointTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLenientConversionMetricsFromTarget(items: RollingTouchpointTarget[]): LenientConversionMetric[] {
  const out: LenientConversionMetric[] = [];
  for (const item of items) {
    const derived = newLenientConversionMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyLenientConversionMetricExtra(item: LenientConversionMetric): string {
  return normalizeTouchpointEstimateCode(item.code);
}
