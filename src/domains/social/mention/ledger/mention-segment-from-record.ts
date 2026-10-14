import { mentionRecordWeight } from "../review/mention-record-policy.js";
import { MentionRecord } from "../review/mention-record.js";
import { MentionSegment, newMentionSegment } from "./mention-segment.js";

export function summarizeMentionRecordsForSegment(items: MentionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMentionSegmentsFromRecord(items: MentionRecord[]): MentionSegment[] {
  const out: MentionSegment[] = [];
  for (const item of items) {
    const derived = newMentionSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileMentionSegment(item: MentionSegment): number {
  return mentionRecordWeight(6, true);
}
