import { cappedWindowRequestWeight } from "../../window/request/capped-window-request-policy.js";
import { CappedWindowRequest } from "../../window/request/capped-window-request.js";
import { BatchedConversionSegment, newBatchedConversionSegment } from "./batched-conversion-segment.js";

export function summarizeCappedWindowRequestsForSegment(items: CappedWindowRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedConversionSegmentsFromRequest(items: CappedWindowRequest[]): BatchedConversionSegment[] {
  const out: BatchedConversionSegment[] = [];
  for (const item of items) {
    const derived = newBatchedConversionSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreBatchedConversionSegment(item: BatchedConversionSegment): number {
  return cappedWindowRequestWeight(6, true);
}
