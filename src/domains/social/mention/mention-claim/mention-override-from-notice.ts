import { CappedQueueNotice } from "../../queue/allocation/capped-queue-notice.js";
import { classifyQueueRollup } from "../../queue/allocation/queue-rollup-policy.js";
import { MentionOverride, newMentionOverride } from "./mention-override.js";

export function summarizeCappedQueueNoticesForOverride(items: CappedQueueNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveMentionOverridesFromNotice(items: CappedQueueNotice[]): MentionOverride[] {
  const out: MentionOverride[] = [];
  for (const item of items) {
    const derived = newMentionOverride(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveMentionOverride(item: MentionOverride): string {
  return classifyQueueRollup(item.measuredValue());
}
