import { scheduledReplyOverrideWeight } from "../../reply/reply-target/scheduled-reply-override-policy.js";
import { ScheduledReplyOverride } from "../../reply/reply-target/scheduled-reply-override.js";
import { MentionEstimate, newMentionEstimate } from "./mention-estimate.js";

export function summarizeScheduledReplyOverridesForEstimate(items: ScheduledReplyOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveMentionEstimatesFromOverride(items: ScheduledReplyOverride[]): MentionEstimate[] {
  const out: MentionEstimate[] = [];
  for (const item of items) {
    const derived = newMentionEstimate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveMentionEstimate(item: MentionEstimate): number {
  return scheduledReplyOverrideWeight(8, true);
}
