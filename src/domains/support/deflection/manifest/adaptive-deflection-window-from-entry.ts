import { normalizeMacroVarianceCode } from "../../macro/slot/macro-variance-policy.js";
import { RollingMacroEntry } from "../../macro/slot/rolling-macro-entry.js";
import { AdaptiveDeflectionWindow, newAdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

export function summarizeRollingMacroEntriesForWindow(items: RollingMacroEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveDeflectionWindowsFromEntry(items: RollingMacroEntry[]): AdaptiveDeflectionWindow[] {
  const out: AdaptiveDeflectionWindow[] = [];
  for (const item of items) {
    const derived = newAdaptiveDeflectionWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyAdaptiveDeflectionWindow(item: AdaptiveDeflectionWindow): string {
  return normalizeMacroVarianceCode(item.code);
}
