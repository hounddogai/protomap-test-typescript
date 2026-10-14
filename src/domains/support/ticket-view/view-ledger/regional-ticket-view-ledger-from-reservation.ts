import { defaultEscalationMetricBucket } from "../../escalation/cycle/default-escalation-metric-policy.js";
import { PrimaryEscalationReservation } from "../../escalation/cycle/primary-escalation-reservation.js";
import { RegionalTicketViewLedger, newRegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

export function summarizePrimaryEscalationReservationsForLedger(items: PrimaryEscalationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRegionalTicketViewLedgersFromReservation(items: PrimaryEscalationReservation[]): RegionalTicketViewLedger[] {
  const out: RegionalTicketViewLedger[] = [];
  for (const item of items) {
    const derived = newRegionalTicketViewLedger(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectRegionalTicketViewLedger(item: RegionalTicketViewLedger): string {
  return defaultEscalationMetricBucket(item.measuredValue());
}
