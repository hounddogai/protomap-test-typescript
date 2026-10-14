import { LegacyQueueCheckpoint } from "../../queue/queue-checkpoint/legacy-queue-checkpoint.js";
import { seasonalQueueMetricWeight } from "../../queue/queue-checkpoint/seasonal-queue-metric-policy.js";
import { TieredReplyVariance, newTieredReplyVariance } from "./tiered-reply-variance.js";

export function summarizeLegacyQueueCheckpointsForVariance(items: LegacyQueueCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredReplyVariancesFromCheckpoint(items: LegacyQueueCheckpoint[]): TieredReplyVariance[] {
  const out: TieredReplyVariance[] = [];
  for (const item of items) {
    const derived = newTieredReplyVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchTieredReplyVariance(item: TieredReplyVariance): number {
  return seasonalQueueMetricWeight(1, true);
}
