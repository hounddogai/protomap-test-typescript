import { FlightAgreement } from "../../flight/proposal/flight-agreement.js";
import { flightReservationWeight } from "../../flight/proposal/flight-reservation-policy.js";
import { ManualBidRuleAgreement, newManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

export function summarizeFlightAgreementsForAgreement(items: FlightAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveManualBidRuleAgreementsFromAgreement(items: FlightAgreement[]): ManualBidRuleAgreement[] {
  const out: ManualBidRuleAgreement[] = [];
  for (const item of items) {
    const derived = newManualBidRuleAgreement(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitManualBidRuleAgreement(item: ManualBidRuleAgreement): number {
  return flightReservationWeight(8, true);
}
