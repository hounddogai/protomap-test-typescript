import { FallbackReplyScore } from "../../reply/batch/fallback-reply-score.js";
import { lenientReplyEntryWeight } from "../../reply/batch/lenient-reply-entry-policy.js";
import { RollingMentionTier, newRollingMentionTier } from "./rolling-mention-tier.js";

export function summarizeFallbackReplyScoresForTier(items: FallbackReplyScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRollingMentionTiersFromScore(items: FallbackReplyScore[]): RollingMentionTier[] {
  const out: RollingMentionTier[] = [];
  for (const item of items) {
    const derived = newRollingMentionTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingMentionTier(item: RollingMentionTier): number {
  return lenientReplyEntryWeight(9, true);
}
