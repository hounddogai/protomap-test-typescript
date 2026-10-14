import { mentionRecordWeight } from "../../mention/review/mention-record-policy.js";
import { MentionWindow } from "../../mention/review/mention-window.js";
import { QueueSchedule, newQueueSchedule } from "./queue-schedule.js";

export function summarizeMentionWindowsForSchedule(items: MentionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveQueueSchedulesFromWindow(items: MentionWindow[]): QueueSchedule[] {
  const out: QueueSchedule[] = [];
  for (const item of items) {
    const derived = newQueueSchedule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeQueueSchedule(item: QueueSchedule): number {
  return mentionRecordWeight(9, true);
}
