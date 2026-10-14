import { insightWindowWeight } from "../../insight/insight-metric/insight-window-policy.js";
import { InsightWindow } from "../../insight/insight-metric/insight-window.js";
import { GlobalMentionTemplate, newGlobalMentionTemplate } from "./global-mention-template.js";

export function summarizeInsightWindowsForTemplate(items: InsightWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveGlobalMentionTemplatesFromWindow(items: InsightWindow[]): GlobalMentionTemplate[] {
  const out: GlobalMentionTemplate[] = [];
  for (const item of items) {
    const derived = newGlobalMentionTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceGlobalMentionTemplate(item: GlobalMentionTemplate): number {
  return insightWindowWeight(2, true);
}
