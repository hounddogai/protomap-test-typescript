import { normalizeExitRuleSegmentCode } from "../../exit-rule/threshold/exit-rule-segment-policy.js";
import { ExitRuleSegment } from "../../exit-rule/threshold/exit-rule-segment.js";
import { CappedEnrollmentReview, newCappedEnrollmentReview } from "./capped-enrollment-review.js";

export function summarizeExitRuleSegmentsForReview(items: ExitRuleSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCappedEnrollmentReviewsFromSegment(items: ExitRuleSegment[]): CappedEnrollmentReview[] {
  const out: CappedEnrollmentReview[] = [];
  for (const item of items) {
    const derived = newCappedEnrollmentReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankCappedEnrollmentReview(item: CappedEnrollmentReview): string {
  return normalizeExitRuleSegmentCode(item.code);
}
