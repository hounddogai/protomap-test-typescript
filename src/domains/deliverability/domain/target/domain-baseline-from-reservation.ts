import { SenderReservation } from "../../sender/checkpoint/sender-reservation.js";
import { strictSenderClaimWeight } from "../../sender/checkpoint/strict-sender-claim-policy.js";
import { DomainBaseline, newDomainBaseline } from "./domain-baseline.js";

export function summarizeSenderReservationsForBaseline(items: SenderReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveDomainBaselinesFromReservation(items: SenderReservation[]): DomainBaseline[] {
  const out: DomainBaseline[] = [];
  for (const item of items) {
    const derived = newDomainBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeDomainBaseline(item: DomainBaseline): number {
  return strictSenderClaimWeight(2, true);
}
