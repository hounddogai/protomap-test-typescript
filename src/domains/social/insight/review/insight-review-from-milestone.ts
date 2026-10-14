import { normalizeBatchedPostMilestoneCode } from "../../post/post-milestone/batched-post-milestone-policy.js";
import { BatchedPostMilestone } from "../../post/post-milestone/batched-post-milestone.js";
import { InsightReview, newInsightReview } from "./insight-review.js";

export function summarizeBatchedPostMilestonesForReview(items: BatchedPostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveInsightReviewsFromMilestone(items: BatchedPostMilestone[]): InsightReview[] {
  const out: InsightReview[] = [];
  for (const item of items) {
    const derived = newInsightReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchInsightReview(item: InsightReview): string {
  return normalizeBatchedPostMilestoneCode(item.code);
}
