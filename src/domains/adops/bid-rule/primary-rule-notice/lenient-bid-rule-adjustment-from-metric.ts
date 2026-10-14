import {
  normalizeBatchedFrequencyMetricCode,
} from "../../frequency/frequency-metric/batched-frequency-metric-policy.js";
import { BatchedFrequencyMetric } from "../../frequency/frequency-metric/batched-frequency-metric.js";
import { LenientBidRuleAdjustment, newLenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

export function summarizeBatchedFrequencyMetricsForAdjustment(items: BatchedFrequencyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveLenientBidRuleAdjustmentsFromMetric(items: BatchedFrequencyMetric[]): LenientBidRuleAdjustment[] {
  const out: LenientBidRuleAdjustment[] = [];
  for (const item of items) {
    const derived = newLenientBidRuleAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLenientBidRuleAdjustment(item: LenientBidRuleAdjustment): string {
  return normalizeBatchedFrequencyMetricCode(item.code);
}
