import { QueueRequest } from "../../queue/metric/queue-request.js";
import { classifyStrictQueueMetric } from "../../queue/metric/strict-queue-metric-policy.js";
import { RollingPostCheckpoint, newRollingPostCheckpoint } from "./rolling-post-checkpoint.js";

export function summarizeQueueRequestsForCheckpoint(items: QueueRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingPostCheckpointsFromRequest(items: QueueRequest[]): RollingPostCheckpoint[] {
  const out: RollingPostCheckpoint[] = [];
  for (const item of items) {
    const derived = newRollingPostCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRollingPostCheckpoint(item: RollingPostCheckpoint): string {
  return classifyStrictQueueMetric(item.projectedValue());
}
