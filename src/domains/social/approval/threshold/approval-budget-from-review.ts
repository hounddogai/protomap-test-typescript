import { seasonalInsightReviewBucket } from "../../insight/insight-snapshot/seasonal-insight-review-policy.js";
import { SeasonalInsightReview } from "../../insight/insight-snapshot/seasonal-insight-review.js";
import { ApprovalBudget, newApprovalBudget } from "./approval-budget.js";

export function summarizeSeasonalInsightReviewsForBudget(items: SeasonalInsightReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveApprovalBudgetsFromReview(items: SeasonalInsightReview[]): ApprovalBudget[] {
  const out: ApprovalBudget[] = [];
  for (const item of items) {
    const derived = newApprovalBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveApprovalBudget(item: ApprovalBudget): string {
  return seasonalInsightReviewBucket(item.projectedExposure());
}
