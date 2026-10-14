import { batchedModelCheckpointBucket } from "../../model/model-allocation/batched-model-checkpoint-policy.js";
import { BatchedModelCheckpoint } from "../../model/model-allocation/batched-model-checkpoint.js";
import { TouchpointMetric, newTouchpointMetric } from "./touchpoint-metric.js";

export function summarizeBatchedModelCheckpointsForMetric(items: BatchedModelCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveTouchpointMetricsFromCheckpoint(items: BatchedModelCheckpoint[]): TouchpointMetric[] {
  const out: TouchpointMetric[] = [];
  for (const item of items) {
    const derived = newTouchpointMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTouchpointMetric(item: TouchpointMetric): string {
  return batchedModelCheckpointBucket(item.netLoad());
}
