import { batchedTouchpointVarianceWeight } from "../../touchpoint/variance/batched-touchpoint-variance-policy.js";
import { GlobalTouchpointPlan } from "../../touchpoint/variance/global-touchpoint-plan.js";
import { BatchedModelBundle, newBatchedModelBundle } from "./batched-model-bundle.js";

export function summarizeGlobalTouchpointPlansForBundle(items: GlobalTouchpointPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveBatchedModelBundlesFromPlan(items: GlobalTouchpointPlan[]): BatchedModelBundle[] {
  const out: BatchedModelBundle[] = [];
  for (const item of items) {
    const derived = newBatchedModelBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBatchedModelBundle(item: BatchedModelBundle): number {
  return batchedTouchpointVarianceWeight(7, true);
}
