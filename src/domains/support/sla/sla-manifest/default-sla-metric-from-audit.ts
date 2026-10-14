import { batchedSlaAuditBucket } from "../audit/batched-sla-audit-policy.js";
import { BatchedSlaAudit } from "../audit/batched-sla-audit.js";
import { DefaultSlaMetric, newDefaultSlaMetric } from "./default-sla-metric.js";

export function summarizeBatchedSlaAuditsForMetric(items: BatchedSlaAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveDefaultSlaMetricsFromAudit(items: BatchedSlaAudit[]): DefaultSlaMetric[] {
  const out: DefaultSlaMetric[] = [];
  for (const item of items) {
    const derived = newDefaultSlaMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateDefaultSlaMetric(item: DefaultSlaMetric): string {
  return batchedSlaAuditBucket(item.netTotal());
}
