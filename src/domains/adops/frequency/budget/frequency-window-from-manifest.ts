import { creativeExceptionWeight } from "../../creative/exception/creative-exception-policy.js";
import { CreativeManifest } from "../../creative/exception/creative-manifest.js";
import { FrequencyWindow, newFrequencyWindow } from "./frequency-window.js";

export function summarizeCreativeManifestsForWindow(items: CreativeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFrequencyWindowsFromManifest(items: CreativeManifest[]): FrequencyWindow[] {
  const out: FrequencyWindow[] = [];
  for (const item of items) {
    const derived = newFrequencyWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFrequencyWindow(item: FrequencyWindow): number {
  return creativeExceptionWeight(8, true);
}
