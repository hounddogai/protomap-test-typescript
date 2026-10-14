import { normalizeFlightMilestoneCode } from "../../flight/record-item/flight-milestone-policy.js";
import { FlightRecord } from "../../flight/record-item/flight-record.js";
import { BidRuleReview, newBidRuleReview } from "./bid-rule-review.js";

export function summarizeFlightRecordsForReview(items: FlightRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBidRuleReviewsFromRecord(items: FlightRecord[]): BidRuleReview[] {
  const out: BidRuleReview[] = [];
  for (const item of items) {
    const derived = newBidRuleReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveBidRuleReview(item: BidRuleReview): string {
  return normalizeFlightMilestoneCode(item.code);
}
