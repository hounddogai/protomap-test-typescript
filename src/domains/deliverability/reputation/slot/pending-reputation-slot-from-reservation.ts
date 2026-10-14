import { warmupReservationBucket } from "../../warmup/regional-warmup-threshold/warmup-reservation-policy.js";
import { WarmupReservation } from "../../warmup/regional-warmup-threshold/warmup-reservation.js";
import { PendingReputationSlot, newPendingReputationSlot } from "./pending-reputation-slot.js";

export function summarizeWarmupReservationsForSlot(items: WarmupReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePendingReputationSlotsFromReservation(items: WarmupReservation[]): PendingReputationSlot[] {
  const out: PendingReputationSlot[] = [];
  for (const item of items) {
    const derived = newPendingReputationSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePendingReputationSlot(item: PendingReputationSlot): string {
  return warmupReservationBucket(item.effectiveTotal());
}
