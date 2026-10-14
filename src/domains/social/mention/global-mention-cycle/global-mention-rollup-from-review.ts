import { BatchedMentionReview } from "../weighted-mention-ledger/batched-mention-review.js";
import { classifyMentionBatch } from "../weighted-mention-ledger/mention-batch-policy.js";
import { GlobalMentionRollup, newGlobalMentionRollup } from "./global-mention-rollup.js";

export function summarizeBatchedMentionReviewsForRollup(items: BatchedMentionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalMentionRollupsFromReview(items: BatchedMentionReview[]): GlobalMentionRollup[] {
  const out: GlobalMentionRollup[] = [];
  for (const item of items) {
    const derived = newGlobalMentionRollup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeGlobalMentionRollup(item: GlobalMentionRollup): string {
  return classifyMentionBatch(item.adjustedVolume());
}
