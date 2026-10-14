import { normalizeLenientPlacementDigestCode } from "../../placement/reservation/lenient-placement-digest-policy.js";
import { PlacementReservation } from "../../placement/reservation/placement-reservation.js";
import { LenientBidRuleBaseline, newLenientBidRuleBaseline } from "./lenient-bid-rule-baseline.js";

export function summarizePlacementReservationsForBaseline(items: PlacementReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientBidRuleBaselinesFromReservation(items: PlacementReservation[]): LenientBidRuleBaseline[] {
  const out: LenientBidRuleBaseline[] = [];
  for (const item of items) {
    const derived = newLenientBidRuleBaseline(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileLenientBidRuleBaseline(item: LenientBidRuleBaseline): string {
  return normalizeLenientPlacementDigestCode(item.code);
}
