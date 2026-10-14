import { BatchedPacingRequest } from "../../pacing/threshold/batched-pacing-request.js";
import { manualPacingExceptionBucket } from "../../pacing/threshold/manual-pacing-exception-policy.js";
import { LegacyFlightReservation, newLegacyFlightReservation } from "./legacy-flight-reservation.js";

export function summarizeBatchedPacingRequestsForReservation(items: BatchedPacingRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLegacyFlightReservationsFromRequest(items: BatchedPacingRequest[]): LegacyFlightReservation[] {
  const out: LegacyFlightReservation[] = [];
  for (const item of items) {
    const derived = newLegacyFlightReservation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyFlightReservation(item: LegacyFlightReservation): string {
  return manualPacingExceptionBucket(item.weightedTotal());
}
