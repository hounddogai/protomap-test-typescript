import {
  normalizePrimaryActivationReservationCode,
} from "../../activation/proposal/primary-activation-reservation-policy.js";
import { PrimaryActivationReservation } from "../../activation/proposal/primary-activation-reservation.js";
import { RegionalCohortClaim, newRegionalCohortClaim } from "./regional-cohort-claim.js";

export function summarizePrimaryActivationReservationsForClaim(items: PrimaryActivationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalCohortClaimsFromReservation(items: PrimaryActivationReservation[]): RegionalCohortClaim[] {
  const out: RegionalCohortClaim[] = [];
  for (const item of items) {
    const derived = newRegionalCohortClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRegionalCohortClaim(item: RegionalCohortClaim): string {
  return normalizePrimaryActivationReservationCode(item.code);
}
