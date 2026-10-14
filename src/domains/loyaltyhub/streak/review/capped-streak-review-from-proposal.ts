import {
  normalizeTieredRedemptionQuotaCode,
} from "../../redemption/redemption-quota/tiered-redemption-quota-policy.js";
import { WeightedRedemptionProposal } from "../../redemption/redemption-quota/weighted-redemption-proposal.js";
import { CappedStreakReview, newCappedStreakReview } from "./capped-streak-review.js";

export function summarizeWeightedRedemptionProposalsForReview(items: WeightedRedemptionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedStreakReviewsFromProposal(items: WeightedRedemptionProposal[]): CappedStreakReview[] {
  const out: CappedStreakReview[] = [];
  for (const item of items) {
    const derived = newCappedStreakReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCappedStreakReview(item: CappedStreakReview): string {
  return normalizeTieredRedemptionQuotaCode(item.code);
}
