import { ModelThreshold } from "../../model/model-digest/model-threshold.js";
import { normalizeTieredModelDigestCode } from "../../model/model-digest/tiered-model-digest-policy.js";
import { GlobalPathMetric, newGlobalPathMetric } from "./global-path-metric.js";

export function summarizeModelThresholdsForMetric(items: ModelThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalPathMetricsFromThreshold(items: ModelThreshold[]): GlobalPathMetric[] {
  const out: GlobalPathMetric[] = [];
  for (const item of items) {
    const derived = newGlobalPathMetric(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveGlobalPathMetric(item: GlobalPathMetric): string {
  return normalizeTieredModelDigestCode(item.code);
}
