import { enrollmentRequestBucket } from "../../enrollment/group/enrollment-request-policy.js";
import { EnrollmentReview } from "../../enrollment/group/enrollment-review.js";
import { RollingWaitBudget, newRollingWaitBudget } from "./rolling-wait-budget.js";

export function summarizeEnrollmentReviewsForBudget(items: EnrollmentReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingWaitBudgetsFromReview(items: EnrollmentReview[]): RollingWaitBudget[] {
  const out: RollingWaitBudget[] = [];
  for (const item of items) {
    const derived = newRollingWaitBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRollingWaitBudget(item: RollingWaitBudget): string {
  return enrollmentRequestBucket(item.adjustedExposure());
}
