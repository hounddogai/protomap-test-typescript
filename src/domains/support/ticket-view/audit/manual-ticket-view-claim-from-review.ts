import { normalizeDeflectionReviewCode } from "../../deflection/template/deflection-review-policy.js";
import { DeflectionReview } from "../../deflection/template/deflection-review.js";
import { ManualTicketViewClaim, newManualTicketViewClaim } from "./manual-ticket-view-claim.js";

export function summarizeDeflectionReviewsForClaim(items: DeflectionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveManualTicketViewClaimsFromReview(items: DeflectionReview[]): ManualTicketViewClaim[] {
  const out: ManualTicketViewClaim[] = [];
  for (const item of items) {
    const derived = newManualTicketViewClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectManualTicketViewClaim(item: ManualTicketViewClaim): string {
  return normalizeDeflectionReviewCode(item.code);
}
