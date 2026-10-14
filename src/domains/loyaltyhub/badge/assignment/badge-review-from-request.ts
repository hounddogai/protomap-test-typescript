import { normalizeStreakRequestCode } from "../../streak/request/streak-request-policy.js";
import { StreakRequest } from "../../streak/request/streak-request.js";
import { BadgeReview, newBadgeReview } from "./badge-review.js";

export function summarizeStreakRequestsForReview(items: StreakRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBadgeReviewsFromRequest(items: StreakRequest[]): BadgeReview[] {
  const out: BadgeReview[] = [];
  for (const item of items) {
    const derived = newBadgeReview(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeBadgeReview(item: BadgeReview): string {
  return normalizeStreakRequestCode(item.code);
}
