import { defaultEscalationMetricBucket } from "../cycle/default-escalation-metric-policy.js";
import { DefaultEscalationMetric } from "../cycle/default-escalation-metric.js";
import { BatchedEscalationNotice, newBatchedEscalationNotice } from "./batched-escalation-notice.js";

export function summarizeDefaultEscalationMetricsForNotice(items: DefaultEscalationMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveBatchedEscalationNoticesFromMetric(items: DefaultEscalationMetric[]): BatchedEscalationNotice[] {
  const out: BatchedEscalationNotice[] = [];
  for (const item of items) {
    const derived = newBatchedEscalationNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyBatchedEscalationNotice(item: BatchedEscalationNotice): string {
  return defaultEscalationMetricBucket(item.adjustedLoad());
}
