import { FallbackFlightMetric } from "../window/fallback-flight-metric.js";
import { globalFlightCycleWeight } from "../window/global-flight-cycle-policy.js";
import { BatchedFlightDraft, newBatchedFlightDraft } from "./batched-flight-draft.js";

export function summarizeFallbackFlightMetricsForDraft(items: FallbackFlightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveBatchedFlightDraftsFromMetric(items: FallbackFlightMetric[]): BatchedFlightDraft[] {
  const out: BatchedFlightDraft[] = [];
  for (const item of items) {
    const derived = newBatchedFlightDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeBatchedFlightDraft(item: BatchedFlightDraft): number {
  return globalFlightCycleWeight(8, true);
}
