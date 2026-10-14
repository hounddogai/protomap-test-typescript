import { classifyCappedBounceTier } from "../../bounce/checkpoint/capped-bounce-tier-policy.js";
import { PrimaryBounceBatch } from "../../bounce/checkpoint/primary-bounce-batch.js";
import { WeightedSenderSegment, newWeightedSenderSegment } from "./weighted-sender-segment.js";

export function summarizePrimaryBounceBatchesForSegment(items: PrimaryBounceBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveWeightedSenderSegmentsFromBatch(items: PrimaryBounceBatch[]): WeightedSenderSegment[] {
  const out: WeightedSenderSegment[] = [];
  for (const item of items) {
    const derived = newWeightedSenderSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedSenderSegment(item: WeightedSenderSegment): string {
  return classifyCappedBounceTier(item.effectiveExposure());
}
