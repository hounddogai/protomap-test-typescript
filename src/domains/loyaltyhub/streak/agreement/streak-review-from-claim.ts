import { classifyStreakClaim } from "../target/streak-claim-policy.js";
import { StreakClaim } from "../target/streak-claim.js";
import { StreakReview, newStreakReview } from "./streak-review.js";

export function summarizeStreakClaimsForReview(items: StreakClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStreakReviewsFromClaim(items: StreakClaim[]): StreakReview[] {
  const out: StreakReview[] = [];
  for (const item of items) {
    const derived = newStreakReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectStreakReview(item: StreakReview): string {
  return classifyStreakClaim(item.effectiveTotal());
}
