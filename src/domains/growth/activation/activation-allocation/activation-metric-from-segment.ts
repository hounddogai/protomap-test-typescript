import { normalizeActivationAllocationCode } from "../allocation/activation-allocation-policy.js";
import { ActivationSegment } from "../allocation/activation-segment.js";
import { ActivationMetric, newActivationMetric } from "./activation-metric.js";

export function summarizeActivationSegmentsForMetric(items: ActivationSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveActivationMetricsFromSegment(items: ActivationSegment[]): ActivationMetric[] {
  const out: ActivationMetric[] = [];
  for (const item of items) {
    const derived = newActivationMetric(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateActivationMetric(item: ActivationMetric): string {
  return normalizeActivationAllocationCode(item.code);
}
