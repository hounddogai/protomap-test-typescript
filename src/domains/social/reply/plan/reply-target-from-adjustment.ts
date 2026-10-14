import { MentionAdjustment } from "../../mention/digest/mention-adjustment.js";
import { mentionDigestWeight } from "../../mention/digest/mention-digest-policy.js";
import { ReplyTarget, newReplyTarget } from "./reply-target.js";

export function summarizeMentionAdjustmentsForTarget(items: MentionAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveReplyTargetsFromAdjustment(items: MentionAdjustment[]): ReplyTarget[] {
  const out: ReplyTarget[] = [];
  for (const item of items) {
    const derived = newReplyTarget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeReplyTarget(item: ReplyTarget): number {
  return mentionDigestWeight(7, true);
}
