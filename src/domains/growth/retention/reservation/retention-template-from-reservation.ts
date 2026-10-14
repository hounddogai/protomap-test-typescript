import { activationReservationBucket } from "../../activation/reservation/activation-reservation-policy.js";
import { ActivationReservation } from "../../activation/reservation/activation-reservation.js";
import { RetentionTemplate, newRetentionTemplate } from "./retention-template.js";

export function summarizeActivationReservationsForTemplate(items: ActivationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRetentionTemplatesFromReservation(items: ActivationReservation[]): RetentionTemplate[] {
  const out: RetentionTemplate[] = [];
  for (const item of items) {
    const derived = newRetentionTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateRetentionTemplate(item: RetentionTemplate): string {
  return activationReservationBucket(item.weightedValue());
}
