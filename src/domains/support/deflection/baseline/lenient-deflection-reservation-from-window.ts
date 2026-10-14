import { regionalTicketViewEntryBucket } from "../../ticket-view/entry/regional-ticket-view-entry-policy.js";
import { StrictTicketViewWindow } from "../../ticket-view/entry/strict-ticket-view-window.js";
import { LenientDeflectionReservation, newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

export function summarizeStrictTicketViewWindowsForReservation(items: StrictTicketViewWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLenientDeflectionReservationsFromWindow(items: StrictTicketViewWindow[]): LenientDeflectionReservation[] {
  const out: LenientDeflectionReservation[] = [];
  for (const item of items) {
    const derived = newLenientDeflectionReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLenientDeflectionReservation(item: LenientDeflectionReservation): string {
  return regionalTicketViewEntryBucket(item.measuredValue());
}
