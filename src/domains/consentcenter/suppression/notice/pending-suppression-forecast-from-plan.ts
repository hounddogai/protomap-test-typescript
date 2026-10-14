import { batchedSuppressionPlanBucket } from "../plan/batched-suppression-plan-policy.js";
import { BatchedSuppressionPlan } from "../plan/batched-suppression-plan.js";
import { PendingSuppressionForecast, newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

export function summarizeBatchedSuppressionPlansForForecast(items: BatchedSuppressionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePendingSuppressionForecastsFromPlan(items: BatchedSuppressionPlan[]): PendingSuppressionForecast[] {
  const out: PendingSuppressionForecast[] = [];
  for (const item of items) {
    const derived = newPendingSuppressionForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPendingSuppressionForecast(item: PendingSuppressionForecast): string {
  return batchedSuppressionPlanBucket(item.measuredValue());
}
