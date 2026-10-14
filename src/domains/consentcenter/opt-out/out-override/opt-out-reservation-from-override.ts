import { ProofOverride } from "../../proof/proof-agreement/proof-override.js";
import { classifyStrictProofSchedule } from "../../proof/proof-agreement/strict-proof-schedule-policy.js";
import { OptOutReservation, newOptOutReservation } from "./opt-out-reservation.js";

export function summarizeProofOverridesForReservation(items: ProofOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveOptOutReservationsFromOverride(items: ProofOverride[]): OptOutReservation[] {
  const out: OptOutReservation[] = [];
  for (const item of items) {
    const derived = newOptOutReservation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleOptOutReservation(item: OptOutReservation): string {
  return classifyStrictProofSchedule(item.netVolume());
}
