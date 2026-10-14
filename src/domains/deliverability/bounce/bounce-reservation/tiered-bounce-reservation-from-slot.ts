import { normalizeManualReputationProposalCode } from "../../reputation/slot/manual-reputation-proposal-policy.js";
import { PendingReputationSlot } from "../../reputation/slot/pending-reputation-slot.js";
import { TieredBounceReservation, newTieredBounceReservation } from "./tiered-bounce-reservation.js";

export function summarizePendingReputationSlotsForReservation(items: PendingReputationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveTieredBounceReservationsFromSlot(items: PendingReputationSlot[]): TieredBounceReservation[] {
  const out: TieredBounceReservation[] = [];
  for (const item of items) {
    const derived = newTieredBounceReservation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveTieredBounceReservation(item: TieredBounceReservation): string {
  return normalizeManualReputationProposalCode(item.code);
}
