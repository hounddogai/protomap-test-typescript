import { ReplyManifest } from "../../reply/reply-target/reply-manifest.js";
import { scheduledReplyOverrideWeight } from "../../reply/reply-target/scheduled-reply-override-policy.js";
import { GlobalInsightReview, newGlobalInsightReview } from "./global-insight-review.js";

export function summarizeReplyManifestsForReview(items: ReplyManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveGlobalInsightReviewsFromManifest(items: ReplyManifest[]): GlobalInsightReview[] {
  const out: GlobalInsightReview[] = [];
  for (const item of items) {
    const derived = newGlobalInsightReview(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalInsightReview(item: GlobalInsightReview): number {
  return scheduledReplyOverrideWeight(9, true);
}
