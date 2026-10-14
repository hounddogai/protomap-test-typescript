import { primaryBadgeForecastBucket } from "../../badge/assignment/primary-badge-forecast-policy.js";
import { RollingBadgeAssignment } from "../../badge/assignment/rolling-badge-assignment.js";
import { FallbackChallengeReview, newFallbackChallengeReview } from "./fallback-challenge-review.js";

export function summarizeRollingBadgeAssignmentsForReview(items: RollingBadgeAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackChallengeReviewsFromAssignment(items: RollingBadgeAssignment[]): FallbackChallengeReview[] {
  const out: FallbackChallengeReview[] = [];
  for (const item of items) {
    const derived = newFallbackChallengeReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileFallbackChallengeReview(item: FallbackChallengeReview): string {
  return primaryBadgeForecastBucket(item.effectiveExposure());
}
