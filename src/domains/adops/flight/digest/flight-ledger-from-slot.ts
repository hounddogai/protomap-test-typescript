import { normalizeBidRuleSlotCode } from "../../bid-rule/notice/bid-rule-slot-policy.js";
import { BidRuleSlot } from "../../bid-rule/notice/bid-rule-slot.js";
import { FlightLedger, newFlightLedger } from "./flight-ledger.js";

export function summarizeBidRuleSlotsForLedger(items: BidRuleSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveFlightLedgersFromSlot(items: BidRuleSlot[]): FlightLedger[] {
  const out: FlightLedger[] = [];
  for (const item of items) {
    const derived = newFlightLedger(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchFlightLedger(item: FlightLedger): string {
  return normalizeBidRuleSlotCode(item.code);
}
