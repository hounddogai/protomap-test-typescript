import { CappedMentionDigest } from "../../mention/mention-digest/capped-mention-digest.js";
import { defaultMentionMappingWeight } from "../../mention/mention-digest/default-mention-mapping-policy.js";
import { CappedQueueNotice, newCappedQueueNotice } from "./capped-queue-notice.js";

export function summarizeCappedMentionDigestsForNotice(items: CappedMentionDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedQueueNoticesFromDigest(items: CappedMentionDigest[]): CappedQueueNotice[] {
  const out: CappedQueueNotice[] = [];
  for (const item of items) {
    const derived = newCappedQueueNotice(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedQueueNotice(item: CappedQueueNotice): number {
  return defaultMentionMappingWeight(2, true);
}
