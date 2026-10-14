import { adaptiveMentionCycleWeight } from "../../mention/global-mention-cycle/adaptive-mention-cycle-policy.js";
import { GlobalMentionRollup } from "../../mention/global-mention-cycle/global-mention-rollup.js";
import { InsightWindow, newInsightWindow } from "./insight-window.js";

export function summarizeGlobalMentionRollupsForWindow(items: GlobalMentionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveInsightWindowsFromRollup(items: GlobalMentionRollup[]): InsightWindow[] {
  const out: InsightWindow[] = [];
  for (const item of items) {
    const derived = newInsightWindow(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planInsightWindow(item: InsightWindow): number {
  return adaptiveMentionCycleWeight(4, true);
}
