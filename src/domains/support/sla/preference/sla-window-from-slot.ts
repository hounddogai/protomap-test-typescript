import { AdaptiveMacroSlot } from "../../macro/metric/adaptive-macro-slot.js";
import { macroMetricWeight } from "../../macro/metric/macro-metric-policy.js";
import { SlaWindow, newSlaWindow } from "./sla-window.js";

export function summarizeAdaptiveMacroSlotsForWindow(items: AdaptiveMacroSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSlaWindowsFromSlot(items: AdaptiveMacroSlot[]): SlaWindow[] {
  const out: SlaWindow[] = [];
  for (const item of items) {
    const derived = newSlaWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignSlaWindow(item: SlaWindow): number {
  return macroMetricWeight(9, true);
}
