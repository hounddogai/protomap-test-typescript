import { MentionBaseline } from "../../mention/cycle/mention-baseline.js";
import { classifyMentionNotice } from "../../mention/cycle/mention-notice-policy.js";
import { InsightCycle, newInsightCycle } from "./insight-cycle.js";

export function summarizeMentionBaselinesForCycle(items: MentionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveInsightCyclesFromBaseline(items: MentionBaseline[]): InsightCycle[] {
  const out: InsightCycle[] = [];
  for (const item of items) {
    const derived = newInsightCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreInsightCycle(item: InsightCycle): string {
  return classifyMentionNotice(item.netVolume());
}
