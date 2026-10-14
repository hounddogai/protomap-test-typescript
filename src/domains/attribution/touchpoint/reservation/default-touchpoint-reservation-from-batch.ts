import { modelAssignmentBucket } from "../../model/assignment/model-assignment-policy.js";
import { ModelBatch } from "../../model/assignment/model-batch.js";
import { DefaultTouchpointReservation, newDefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

export function summarizeModelBatchesForReservation(items: ModelBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveDefaultTouchpointReservationsFromBatch(items: ModelBatch[]): DefaultTouchpointReservation[] {
  const out: DefaultTouchpointReservation[] = [];
  for (const item of items) {
    const derived = newDefaultTouchpointReservation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitDefaultTouchpointReservation(item: DefaultTouchpointReservation): string {
  return modelAssignmentBucket(item.adjustedExposure());
}
