import { ManualQueuePreference } from "../../queue/milestone/manual-queue-preference.js";
import { queueMilestoneBucket } from "../../queue/milestone/queue-milestone-policy.js";
import { MentionWindow, newMentionWindow } from "./mention-window.js";

export function summarizeManualQueuePreferencesForWindow(items: ManualQueuePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveMentionWindowsFromPreference(items: ManualQueuePreference[]): MentionWindow[] {
  const out: MentionWindow[] = [];
  for (const item of items) {
    const derived = newMentionWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchMentionWindow(item: MentionWindow): string {
  return queueMilestoneBucket(item.projectedLoad());
}
