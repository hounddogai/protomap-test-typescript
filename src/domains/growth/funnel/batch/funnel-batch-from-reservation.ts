import { activationReservationWeight } from "../../activation/reservation/activation-reservation-policy.js";
import { ActivationReservation } from "../../activation/reservation/activation-reservation.js";
import { FunnelBatch, newFunnelBatch } from "./funnel-batch.js";

export function summarizeActivationReservationsForBatch(items: ActivationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveFunnelBatchesFromReservation(items: ActivationReservation[]): FunnelBatch[] {
  const out: FunnelBatch[] = [];
  for (const item of items) {
    const derived = newFunnelBatch(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planFunnelBatch(item: FunnelBatch): number {
  return activationReservationWeight(5, true);
}
