import { insightAgreementBucket } from "../../insight/schedule/insight-agreement-policy.js";
import { SeasonalInsightSchedule } from "../../insight/schedule/seasonal-insight-schedule.js";
import { StrictReplyWindow, newStrictReplyWindow } from "./strict-reply-window.js";

export function summarizeSeasonalInsightSchedulesForWindow(items: SeasonalInsightSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStrictReplyWindowsFromSchedule(items: SeasonalInsightSchedule[]): StrictReplyWindow[] {
  const out: StrictReplyWindow[] = [];
  for (const item of items) {
    const derived = newStrictReplyWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStrictReplyWindowExtra(item: StrictReplyWindow): string {
  return insightAgreementBucket(item.adjustedValue());
}
