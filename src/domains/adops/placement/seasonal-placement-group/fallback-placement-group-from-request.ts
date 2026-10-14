import { batchedPacingRequestBucket } from "../../pacing/threshold/batched-pacing-request-policy.js";
import { BatchedPacingRequest } from "../../pacing/threshold/batched-pacing-request.js";
import { FallbackPlacementGroup, newFallbackPlacementGroup } from "./fallback-placement-group.js";

export function summarizeBatchedPacingRequestsForGroup(items: BatchedPacingRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveFallbackPlacementGroupsFromRequest(items: BatchedPacingRequest[]): FallbackPlacementGroup[] {
  const out: FallbackPlacementGroup[] = [];
  for (const item of items) {
    const derived = newFallbackPlacementGroup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignFallbackPlacementGroup(item: FallbackPlacementGroup): string {
  return batchedPacingRequestBucket(item.adjustedExposure());
}
