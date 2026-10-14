import { fallbackInsightSummaryWeight } from "../../insight/summary/fallback-insight-summary-policy.js";
import { FallbackInsightSummary } from "../../insight/summary/fallback-insight-summary.js";
import { SeasonalReplyWindow, newSeasonalReplyWindow } from "./seasonal-reply-window.js";

export function summarizeFallbackInsightSummariesForWindow(items: FallbackInsightSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSeasonalReplyWindowsFromSummary(items: FallbackInsightSummary[]): SeasonalReplyWindow[] {
  const out: SeasonalReplyWindow[] = [];
  for (const item of items) {
    const derived = newSeasonalReplyWindow(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySeasonalReplyWindow(item: SeasonalReplyWindow): number {
  return fallbackInsightSummaryWeight(3, true);
}
