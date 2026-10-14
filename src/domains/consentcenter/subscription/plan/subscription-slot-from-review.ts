import { LegacyProofReview } from "../../proof/request/legacy-proof-review.js";
import { proofRequestWeight } from "../../proof/request/proof-request-policy.js";
import { SubscriptionSlot, newSubscriptionSlot } from "./subscription-slot.js";

export function summarizeLegacyProofReviewsForSlot(items: LegacyProofReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSubscriptionSlotsFromReview(items: LegacyProofReview[]): SubscriptionSlot[] {
  const out: SubscriptionSlot[] = [];
  for (const item of items) {
    const derived = newSubscriptionSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planSubscriptionSlot(item: SubscriptionSlot): number {
  return proofRequestWeight(2, true);
}
