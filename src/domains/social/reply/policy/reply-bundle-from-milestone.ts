import { batchedPostMilestoneBucket } from "../../post/post-milestone/batched-post-milestone-policy.js";
import { BatchedPostMilestone } from "../../post/post-milestone/batched-post-milestone.js";
import { ReplyBundle, newReplyBundle } from "./reply-bundle.js";

export function summarizeBatchedPostMilestonesForBundle(items: BatchedPostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveReplyBundlesFromMilestone(items: BatchedPostMilestone[]): ReplyBundle[] {
  const out: ReplyBundle[] = [];
  for (const item of items) {
    const derived = newReplyBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileReplyBundle(item: ReplyBundle): string {
  return batchedPostMilestoneBucket(item.weightedExposure());
}
