import { GlobalPostRollup } from "../score/global-post-rollup.js";
import { classifyScheduledPostScore } from "../score/scheduled-post-score-policy.js";
import { LegacyPostReview, newLegacyPostReview } from "./legacy-post-review.js";

export function summarizeGlobalPostRollupsForReview(items: GlobalPostRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLegacyPostReviewsFromRollup(items: GlobalPostRollup[]): LegacyPostReview[] {
  const out: LegacyPostReview[] = [];
  for (const item of items) {
    const derived = newLegacyPostReview(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyLegacyPostReview(item: LegacyPostReview): string {
  return classifyScheduledPostScore(item.effectiveVolume());
}
