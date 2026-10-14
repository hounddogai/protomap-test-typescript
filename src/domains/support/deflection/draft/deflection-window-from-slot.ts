import { AdaptiveMacroSlot } from "../../macro/metric/adaptive-macro-slot.js";
import { macroMetricWeight } from "../../macro/metric/macro-metric-policy.js";
import { DeflectionWindow, newDeflectionWindow } from "./deflection-window.js";

export function summarizeAdaptiveMacroSlotsForWindow(items: AdaptiveMacroSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveDeflectionWindowsFromSlot(items: AdaptiveMacroSlot[]): DeflectionWindow[] {
  const out: DeflectionWindow[] = [];
  for (const item of items) {
    const derived = newDeflectionWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeDeflectionWindow(item: DeflectionWindow): number {
  return macroMetricWeight(7, true);
}
