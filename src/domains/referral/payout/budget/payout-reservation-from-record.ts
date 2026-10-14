import { fraudCheckGroupWeight } from "../../fraud-check/group/fraud-check-group-policy.js";
import { FraudCheckRecord } from "../../fraud-check/group/fraud-check-record.js";
import { PayoutReservation, newPayoutReservation } from "./payout-reservation.js";

export function summarizeFraudCheckRecordsForReservation(items: FraudCheckRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePayoutReservationsFromRecord(items: FraudCheckRecord[]): PayoutReservation[] {
  const out: PayoutReservation[] = [];
  for (const item of items) {
    const derived = newPayoutReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePayoutReservation(item: PayoutReservation): number {
  return fraudCheckGroupWeight(1, true);
}
