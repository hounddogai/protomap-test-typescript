import { BatchedReplyException } from "../../reply/reply-draft/batched-reply-exception.js";
import { regionalReplyDraftBucket } from "../../reply/reply-draft/regional-reply-draft-policy.js";
import { PendingPostAllocation, newPendingPostAllocation } from "./pending-post-allocation.js";

export function summarizeBatchedReplyExceptionsForAllocation(items: BatchedReplyException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePendingPostAllocationsFromException(items: BatchedReplyException[]): PendingPostAllocation[] {
  const out: PendingPostAllocation[] = [];
  for (const item of items) {
    const derived = newPendingPostAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPendingPostAllocation(item: PendingPostAllocation): string {
  return regionalReplyDraftBucket(item.effectiveVolume());
}
