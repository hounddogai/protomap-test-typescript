import { creditExceptionWeight } from "../../credit/override-item/credit-exception-policy.js";
import { DefaultCreditOverride } from "../../credit/override-item/default-credit-override.js";
import { WindowReservation, newWindowReservation } from "./window-reservation.js";

export function summarizeDefaultCreditOverridesForReservation(items: DefaultCreditOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWindowReservationsFromOverride(items: DefaultCreditOverride[]): WindowReservation[] {
  const out: WindowReservation[] = [];
  for (const item of items) {
    const derived = newWindowReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWindowReservation(item: WindowReservation): number {
  return creditExceptionWeight(1, true);
}
