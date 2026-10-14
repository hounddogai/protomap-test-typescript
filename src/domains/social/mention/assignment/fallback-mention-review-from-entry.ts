import { classifyQueueEntry } from "../../queue/checkpoint/queue-entry-policy.js";
import { QueueEntry } from "../../queue/checkpoint/queue-entry.js";
import { FallbackMentionReview, newFallbackMentionReview } from "./fallback-mention-review.js";

export function summarizeQueueEntriesForReview(items: QueueEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveFallbackMentionReviewsFromEntry(items: QueueEntry[]): FallbackMentionReview[] {
  const out: FallbackMentionReview[] = [];
  for (const item of items) {
    const derived = newFallbackMentionReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyFallbackMentionReview(item: FallbackMentionReview): string {
  return classifyQueueEntry(item.measuredValue());
}
