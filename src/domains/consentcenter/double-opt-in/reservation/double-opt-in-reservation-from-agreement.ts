import { classifyDoubleOptInAgreement } from "../agreement/double-opt-in-agreement-policy.js";
import { DoubleOptInAgreement } from "../agreement/double-opt-in-agreement.js";
import { DoubleOptInReservation, newDoubleOptInReservation } from "./double-opt-in-reservation.js";

export function summarizeDoubleOptInAgreementsForReservation(items: DoubleOptInAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDoubleOptInReservationsFromAgreement(items: DoubleOptInAgreement[]): DoubleOptInReservation[] {
  const out: DoubleOptInReservation[] = [];
  for (const item of items) {
    const derived = newDoubleOptInReservation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreDoubleOptInReservation(item: DoubleOptInReservation): string {
  return classifyDoubleOptInAgreement(item.effectiveVolume());
}
