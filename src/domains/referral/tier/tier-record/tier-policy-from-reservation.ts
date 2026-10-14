import { normalizePayoutRecordCode } from "../../payout/agreement/payout-record-policy.js";
import { ScheduledPayoutReservation } from "../../payout/agreement/scheduled-payout-reservation.js";
import { TierPolicy, newTierPolicy } from "./tier-policy.js";

export function summarizeScheduledPayoutReservationsForPolicy(items: ScheduledPayoutReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTierPoliciesFromReservation(items: ScheduledPayoutReservation[]): TierPolicy[] {
  const out: TierPolicy[] = [];
  for (const item of items) {
    const derived = newTierPolicy(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateTierPolicy(item: TierPolicy): string {
  return normalizePayoutRecordCode(item.code);
}
