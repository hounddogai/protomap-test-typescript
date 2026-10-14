import { primaryMentionDraftWeight } from "../../mention/record-item/primary-mention-draft-policy.js";
import { RollingMentionRecord } from "../../mention/record-item/rolling-mention-record.js";
import { BatchedReplyClaim, newBatchedReplyClaim } from "./batched-reply-claim.js";

export function summarizeRollingMentionRecordsForClaim(items: RollingMentionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBatchedReplyClaimsFromRecord(items: RollingMentionRecord[]): BatchedReplyClaim[] {
  const out: BatchedReplyClaim[] = [];
  for (const item of items) {
    const derived = newBatchedReplyClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchBatchedReplyClaim(item: BatchedReplyClaim): number {
  return primaryMentionDraftWeight(2, true);
}
