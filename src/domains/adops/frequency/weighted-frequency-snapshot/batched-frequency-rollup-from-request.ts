import { batchedFlightDraftBucket } from "../../flight/draft/batched-flight-draft-policy.js";
import { FlightRequest } from "../../flight/draft/flight-request.js";
import { BatchedFrequencyRollup, newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

export function summarizeFlightRequestsForRollup(items: FlightRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBatchedFrequencyRollupsFromRequest(items: FlightRequest[]): BatchedFrequencyRollup[] {
  const out: BatchedFrequencyRollup[] = [];
  for (const item of items) {
    const derived = newBatchedFrequencyRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleBatchedFrequencyRollup(item: BatchedFrequencyRollup): string {
  return batchedFlightDraftBucket(item.projectedLoad());
}
