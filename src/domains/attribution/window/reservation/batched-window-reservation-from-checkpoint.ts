import { GlobalModelCheckpoint } from "../../model/mapping/global-model-checkpoint.js";
import { modelScoreBucket } from "../../model/mapping/model-score-policy.js";
import { BatchedWindowReservation, newBatchedWindowReservation } from "./batched-window-reservation.js";

export function summarizeGlobalModelCheckpointsForReservation(items: GlobalModelCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBatchedWindowReservationsFromCheckpoint(items: GlobalModelCheckpoint[]): BatchedWindowReservation[] {
  const out: BatchedWindowReservation[] = [];
  for (const item of items) {
    const derived = newBatchedWindowReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchBatchedWindowReservation(item: BatchedWindowReservation): string {
  return modelScoreBucket(item.effectiveLoad());
}
