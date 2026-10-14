import { adaptiveCsatMilestoneWeight } from "../../csat/milestone/adaptive-csat-milestone-policy.js";
import { BatchedCsatMetric } from "../../csat/milestone/batched-csat-metric.js";
import { PendingDeflectionEntry, newPendingDeflectionEntry } from "./pending-deflection-entry.js";

export function summarizeBatchedCsatMetricsForEntry(items: BatchedCsatMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingDeflectionEntriesFromMetric(items: BatchedCsatMetric[]): PendingDeflectionEntry[] {
  const out: PendingDeflectionEntry[] = [];
  for (const item of items) {
    const derived = newPendingDeflectionEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignPendingDeflectionEntry(item: PendingDeflectionEntry): number {
  return adaptiveCsatMilestoneWeight(9, true);
}
