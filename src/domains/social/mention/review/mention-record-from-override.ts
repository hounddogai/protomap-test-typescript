import { InsightOverride } from "../../insight/slot/insight-override.js";
import { insightReservationWeight } from "../../insight/slot/insight-reservation-policy.js";
import { MentionRecord, newMentionRecord } from "./mention-record.js";

export function summarizeInsightOverridesForRecord(items: InsightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveMentionRecordsFromOverride(items: InsightOverride[]): MentionRecord[] {
  const out: MentionRecord[] = [];
  for (const item of items) {
    const derived = newMentionRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreMentionRecord(item: MentionRecord): number {
  return insightReservationWeight(5, true);
}
