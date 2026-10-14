import { classifyPostReservation } from "../../post/rule/post-reservation-policy.js";
import { PostRule } from "../../post/rule/post-rule.js";
import { RegionalApprovalReview, newRegionalApprovalReview } from "./regional-approval-review.js";

export function summarizePostRulesForReview(items: PostRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRegionalApprovalReviewsFromRule(items: PostRule[]): RegionalApprovalReview[] {
  const out: RegionalApprovalReview[] = [];
  for (const item of items) {
    const derived = newRegionalApprovalReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreRegionalApprovalReview(item: RegionalApprovalReview): string {
  return classifyPostReservation(item.netVolume());
}
