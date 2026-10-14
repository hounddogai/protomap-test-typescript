import { cappedFrequencyReservationWeight } from "../reservation/capped-frequency-reservation-policy.js";
import { CappedFrequencyReservation } from "../reservation/capped-frequency-reservation.js";
import { RollingFrequencyClaim, newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

export function summarizeCappedFrequencyReservationsForClaim(items: CappedFrequencyReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingFrequencyClaimsFromReservation(items: CappedFrequencyReservation[]): RollingFrequencyClaim[] {
  const out: RollingFrequencyClaim[] = [];
  for (const item of items) {
    const derived = newRollingFrequencyClaim(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveRollingFrequencyClaim(item: RollingFrequencyClaim): number {
  return cappedFrequencyReservationWeight(9, true);
}
