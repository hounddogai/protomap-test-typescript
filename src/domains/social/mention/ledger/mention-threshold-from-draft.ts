import { LenientQueueDraft } from "../../queue/draft/lenient-queue-draft.js";
import { queueSummaryWeight } from "../../queue/draft/queue-summary-policy.js";
import { MentionThreshold, newMentionThreshold } from "./mention-threshold.js";

export function summarizeLenientQueueDraftsForThreshold(items: LenientQueueDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMentionThresholdsFromDraft(items: LenientQueueDraft[]): MentionThreshold[] {
  const out: MentionThreshold[] = [];
  for (const item of items) {
    const derived = newMentionThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreMentionThreshold(item: MentionThreshold): number {
  return queueSummaryWeight(8, true);
}
