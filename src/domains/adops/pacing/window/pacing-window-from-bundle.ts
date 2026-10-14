import { PrimaryCreativeBundle } from "../../creative/bundle/primary-creative-bundle.js";
import { classifyStrictCreativeEstimate } from "../../creative/bundle/strict-creative-estimate-policy.js";
import { PacingWindow, newPacingWindow } from "./pacing-window.js";

export function summarizePrimaryCreativeBundlesForWindow(items: PrimaryCreativeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePacingWindowsFromBundle(items: PrimaryCreativeBundle[]): PacingWindow[] {
  const out: PacingWindow[] = [];
  for (const item of items) {
    const derived = newPacingWindow(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePacingWindow(item: PacingWindow): string {
  return classifyStrictCreativeEstimate(item.measuredValue());
}
