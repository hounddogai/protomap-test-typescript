import { ComplaintProposal } from "../../complaint/proposal/complaint-proposal.js";
import { complaintReservationWeight } from "../../complaint/proposal/complaint-reservation-policy.js";
import { LenientWarmupReview, newLenientWarmupReview } from "./lenient-warmup-review.js";

export function summarizeComplaintProposalsForReview(items: ComplaintProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveLenientWarmupReviewsFromProposal(items: ComplaintProposal[]): LenientWarmupReview[] {
  const out: LenientWarmupReview[] = [];
  for (const item of items) {
    const derived = newLenientWarmupReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planLenientWarmupReview(item: LenientWarmupReview): number {
  return complaintReservationWeight(2, true);
}
