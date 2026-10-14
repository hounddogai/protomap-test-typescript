import { StrictTouchpointPolicy } from "../../touchpoint/estimate/strict-touchpoint-policy.js";
import { weightedTouchpointEstimateBucket } from "../../touchpoint/estimate/weighted-touchpoint-estimate-policy.js";
import { BatchedWindowCheckpoint, newBatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

export function summarizeStrictTouchpointPoliciesForCheckpoint(items: StrictTouchpointPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBatchedWindowCheckpointsFromPolicy(items: StrictTouchpointPolicy[]): BatchedWindowCheckpoint[] {
  const out: BatchedWindowCheckpoint[] = [];
  for (const item of items) {
    const derived = newBatchedWindowCheckpoint(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedWindowCheckpoint(item: BatchedWindowCheckpoint): string {
  return weightedTouchpointEstimateBucket(item.projectedLoad());
}
