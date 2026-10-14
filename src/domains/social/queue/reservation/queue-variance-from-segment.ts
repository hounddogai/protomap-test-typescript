import { QueueSegment } from "../segment/queue-segment.js";
import { queueTargetWeight } from "../segment/queue-target-policy.js";
import { QueueVariance, newQueueVariance } from "./queue-variance.js";

export function summarizeQueueSegmentsForVariance(items: QueueSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveQueueVariancesFromSegment(items: QueueSegment[]): QueueVariance[] {
  const out: QueueVariance[] = [];
  for (const item of items) {
    const derived = newQueueVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyQueueVariance(item: QueueVariance): number {
  return queueTargetWeight(1, true);
}
