import { LenientExitRuleAdjustment } from "../../exit-rule/adjustment/lenient-exit-rule-adjustment.js";
import { normalizePendingExitRuleRecordCode } from "../../exit-rule/adjustment/pending-exit-rule-record-policy.js";
import { CappedJourneyReview, newCappedJourneyReview } from "./capped-journey-review.js";

export function summarizeLenientExitRuleAdjustmentsForReview(items: LenientExitRuleAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCappedJourneyReviewsFromAdjustment(items: LenientExitRuleAdjustment[]): CappedJourneyReview[] {
  const out: CappedJourneyReview[] = [];
  for (const item of items) {
    const derived = newCappedJourneyReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCappedJourneyReview(item: CappedJourneyReview): string {
  return normalizePendingExitRuleRecordCode(item.code);
}
