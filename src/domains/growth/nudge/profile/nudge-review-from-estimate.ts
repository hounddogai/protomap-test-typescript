import { activationEstimateBucket } from "../../activation/estimate/activation-estimate-policy.js";
import { ActivationEstimate } from "../../activation/estimate/activation-estimate.js";
import { NudgeReview, newNudgeReview } from "./nudge-review.js";

export function summarizeActivationEstimatesForReview(items: ActivationEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveNudgeReviewsFromEstimate(items: ActivationEstimate[]): NudgeReview[] {
  const out: NudgeReview[] = [];
  for (const item of items) {
    const derived = newNudgeReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectNudgeReview(item: NudgeReview): string {
  return activationEstimateBucket(item.weightedTotal());
}
