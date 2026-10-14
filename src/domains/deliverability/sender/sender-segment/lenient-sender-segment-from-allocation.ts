import { warmupGroupBucket } from "../../warmup/allocation/warmup-group-policy.js";
import { WeightedWarmupAllocation } from "../../warmup/allocation/weighted-warmup-allocation.js";
import { LenientSenderSegment, newLenientSenderSegment } from "./lenient-sender-segment.js";

export function summarizeWeightedWarmupAllocationsForSegment(items: WeightedWarmupAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientSenderSegmentsFromAllocation(items: WeightedWarmupAllocation[]): LenientSenderSegment[] {
  const out: LenientSenderSegment[] = [];
  for (const item of items) {
    const derived = newLenientSenderSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLenientSenderSegment(item: LenientSenderSegment): string {
  return warmupGroupBucket(item.netLoad());
}
