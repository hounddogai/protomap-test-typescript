import { pacingClaimWeight } from "../score/pacing-claim-policy.js";
import { PacingTarget } from "../score/pacing-target.js";
import { PacingReservation, newPacingReservation } from "./pacing-reservation.js";

export function summarizePacingTargetsForReservation(items: PacingTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePacingReservationsFromTarget(items: PacingTarget[]): PacingReservation[] {
  const out: PacingReservation[] = [];
  for (const item of items) {
    const derived = newPacingReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePacingReservation(item: PacingReservation): number {
  return pacingClaimWeight(2, true);
}
