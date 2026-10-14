import { normalizeCreativeReviewCode } from "../../creative/forecast/creative-review-policy.js";
import { CreativeReview } from "../../creative/forecast/creative-review.js";
import { FrequencyClaim, newFrequencyClaim } from "./frequency-claim.js";

export function summarizeCreativeReviewsForClaim(items: CreativeReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFrequencyClaimsFromReview(items: CreativeReview[]): FrequencyClaim[] {
  const out: FrequencyClaim[] = [];
  for (const item of items) {
    const derived = newFrequencyClaim(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreFrequencyClaim(item: FrequencyClaim): string {
  return normalizeCreativeReviewCode(item.code);
}
