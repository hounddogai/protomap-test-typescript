import { macroDigestBucket } from "../../macro/threshold/macro-digest-policy.js";
import { MacroReview } from "../../macro/threshold/macro-review.js";
import { TicketViewReview, newTicketViewReview } from "./ticket-view-review.js";

export function summarizeMacroReviewsForReview(items: MacroReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveTicketViewReviewsFromReview(items: MacroReview[]): TicketViewReview[] {
  const out: TicketViewReview[] = [];
  for (const item of items) {
    const derived = newTicketViewReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitTicketViewReview(item: TicketViewReview): string {
  return macroDigestBucket(item.netValue());
}
