import { ManualTierMilestone } from "../milestone/manual-tier-milestone.js";
import { classifySeasonalTierPolicy } from "../milestone/seasonal-tier-policy-policy.js";
import { TierReview, newTierReview } from "./tier-review.js";

export function summarizeManualTierMilestonesForReview(items: ManualTierMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveTierReviewsFromMilestone(items: ManualTierMilestone[]): TierReview[] {
  const out: TierReview[] = [];
  for (const item of items) {
    const derived = newTierReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTierReview(item: TierReview): string {
  return classifySeasonalTierPolicy(item.projectedExposure());
}
