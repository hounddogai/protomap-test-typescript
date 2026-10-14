import { payoutBundleWeight } from "../../payout/adjustment/payout-bundle-policy.js";
import { PayoutBundle } from "../../payout/adjustment/payout-bundle.js";
import { InviteReview, newInviteReview } from "./invite-review.js";

export function summarizePayoutBundlesForReview(items: PayoutBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveInviteReviewsFromBundle(items: PayoutBundle[]): InviteReview[] {
  const out: InviteReview[] = [];
  for (const item of items) {
    const derived = newInviteReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyInviteReviewExtra(item: InviteReview): number {
  return payoutBundleWeight(5, true);
}
