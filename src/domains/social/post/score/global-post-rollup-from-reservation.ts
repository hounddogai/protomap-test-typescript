import { seasonalQueueReservationWeight } from "../../queue/queue-reservation/seasonal-queue-reservation-policy.js";
import { SeasonalQueueReservation } from "../../queue/queue-reservation/seasonal-queue-reservation.js";
import { GlobalPostRollup, newGlobalPostRollup } from "./global-post-rollup.js";

export function summarizeSeasonalQueueReservationsForRollup(items: SeasonalQueueReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveGlobalPostRollupsFromReservation(items: SeasonalQueueReservation[]): GlobalPostRollup[] {
  const out: GlobalPostRollup[] = [];
  for (const item of items) {
    const derived = newGlobalPostRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignGlobalPostRollup(item: GlobalPostRollup): number {
  return seasonalQueueReservationWeight(9, true);
}
