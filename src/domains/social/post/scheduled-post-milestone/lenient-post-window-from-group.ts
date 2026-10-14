import { classifyFallbackInsightGroup } from "../../insight/group/fallback-insight-group-policy.js";
import { FallbackInsightGroup } from "../../insight/group/fallback-insight-group.js";
import { LenientPostWindow, newLenientPostWindow } from "./lenient-post-window.js";

export function summarizeFallbackInsightGroupsForWindow(items: FallbackInsightGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLenientPostWindowsFromGroup(items: FallbackInsightGroup[]): LenientPostWindow[] {
  const out: LenientPostWindow[] = [];
  for (const item of items) {
    const derived = newLenientPostWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveLenientPostWindow(item: LenientPostWindow): string {
  return classifyFallbackInsightGroup(item.measuredValue());
}
