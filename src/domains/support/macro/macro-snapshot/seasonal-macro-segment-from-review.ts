import { CsatReview } from "../../csat/digest/csat-review.js";
import { pendingCsatPolicyBucket } from "../../csat/digest/pending-csat-policy-policy.js";
import { SeasonalMacroSegment, newSeasonalMacroSegment } from "./seasonal-macro-segment.js";

export function summarizeCsatReviewsForSegment(items: CsatReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSeasonalMacroSegmentsFromReview(items: CsatReview[]): SeasonalMacroSegment[] {
  const out: SeasonalMacroSegment[] = [];
  for (const item of items) {
    const derived = newSeasonalMacroSegment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeSeasonalMacroSegment(item: SeasonalMacroSegment): string {
  return pendingCsatPolicyBucket(item.measuredValue());
}
