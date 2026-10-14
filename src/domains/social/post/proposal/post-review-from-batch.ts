import { ReplyBatch } from "../../reply/reservation/reply-batch.js";
import { normalizeReplySnapshotCode } from "../../reply/reservation/reply-snapshot-policy.js";
import { PostReview, newPostReview } from "./post-review.js";

export function summarizeReplyBatchesForReview(items: ReplyBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePostReviewsFromBatch(items: ReplyBatch[]): PostReview[] {
  const out: PostReview[] = [];
  for (const item of items) {
    const derived = newPostReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balancePostReview(item: PostReview): string {
  return normalizeReplySnapshotCode(item.code);
}
