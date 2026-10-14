import { mentionScheduleBucket } from "../schedule/mention-schedule-policy.js";
import { MentionSchedule } from "../schedule/mention-schedule.js";
import { MentionDraft, newMentionDraft } from "./mention-draft.js";

export function summarizeMentionSchedulesForDraft(items: MentionSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveMentionDraftsFromSchedule(items: MentionSchedule[]): MentionDraft[] {
  const out: MentionDraft[] = [];
  for (const item of items) {
    const derived = newMentionDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveMentionDraft(item: MentionDraft): string {
  return mentionScheduleBucket(item.adjustedVolume());
}
