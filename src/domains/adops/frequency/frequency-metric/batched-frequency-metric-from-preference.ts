import { adaptiveCreativeBundleBucket } from "../../creative/proposal/adaptive-creative-bundle-policy.js";
import { CreativePreference } from "../../creative/proposal/creative-preference.js";
import { BatchedFrequencyMetric, newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

export function summarizeCreativePreferencesForMetric(items: CreativePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBatchedFrequencyMetricsFromPreference(items: CreativePreference[]): BatchedFrequencyMetric[] {
  const out: BatchedFrequencyMetric[] = [];
  for (const item of items) {
    const derived = newBatchedFrequencyMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreBatchedFrequencyMetric(item: BatchedFrequencyMetric): string {
  return adaptiveCreativeBundleBucket(item.netVolume());
}
