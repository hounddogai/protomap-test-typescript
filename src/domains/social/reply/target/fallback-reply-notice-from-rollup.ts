import { legacyMentionGroupBucket } from "../../mention/rollup/legacy-mention-group-policy.js";
import { MentionRollup } from "../../mention/rollup/mention-rollup.js";
import { FallbackReplyNotice, newFallbackReplyNotice } from "./fallback-reply-notice.js";

export function summarizeMentionRollupsForNotice(items: MentionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFallbackReplyNoticesFromRollup(items: MentionRollup[]): FallbackReplyNotice[] {
  const out: FallbackReplyNotice[] = [];
  for (const item of items) {
    const derived = newFallbackReplyNotice(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFallbackReplyNotice(item: FallbackReplyNotice): string {
  return legacyMentionGroupBucket(item.weightedLoad());
}
