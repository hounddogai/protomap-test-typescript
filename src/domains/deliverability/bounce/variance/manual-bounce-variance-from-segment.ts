import { batchedDomainSegmentBucket } from "../../domain/segment/batched-domain-segment-policy.js";
import { BatchedDomainSegment } from "../../domain/segment/batched-domain-segment.js";
import { ManualBounceVariance, newManualBounceVariance } from "./manual-bounce-variance.js";

export function summarizeBatchedDomainSegmentsForVariance(items: BatchedDomainSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveManualBounceVariancesFromSegment(items: BatchedDomainSegment[]): ManualBounceVariance[] {
  const out: ManualBounceVariance[] = [];
  for (const item of items) {
    const derived = newManualBounceVariance(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateManualBounceVariance(item: ManualBounceVariance): string {
  return batchedDomainSegmentBucket(item.measuredValue());
}
