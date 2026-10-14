import { LenientPayoutLedger } from "../../payout/payout-ledger/lenient-payout-ledger.js";
import { classifyPayoutRollup } from "../../payout/payout-ledger/payout-rollup-policy.js";
import { PendingInviteSlot, newPendingInviteSlot } from "./pending-invite-slot.js";

export function summarizeLenientPayoutLedgersForSlot(items: LenientPayoutLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePendingInviteSlotsFromLedger(items: LenientPayoutLedger[]): PendingInviteSlot[] {
  const out: PendingInviteSlot[] = [];
  for (const item of items) {
    const derived = newPendingInviteSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPendingInviteSlotExtra(item: PendingInviteSlot): string {
  return classifyPayoutRollup(item.effectiveTotal());
}
