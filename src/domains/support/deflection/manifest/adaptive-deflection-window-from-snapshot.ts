import { classifyScheduledDeflectionSnapshot } from "../draft/scheduled-deflection-snapshot-policy.js";
import { ScheduledDeflectionSnapshot } from "../draft/scheduled-deflection-snapshot.js";
import { AdaptiveDeflectionWindow, newAdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

export function summarizeScheduledDeflectionSnapshotsForWindow(items: ScheduledDeflectionSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveAdaptiveDeflectionWindowsFromSnapshot(items: ScheduledDeflectionSnapshot[]): AdaptiveDeflectionWindow[] {
  const out: AdaptiveDeflectionWindow[] = [];
  for (const item of items) {
    const derived = newAdaptiveDeflectionWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveDeflectionWindow(item: AdaptiveDeflectionWindow): string {
  return classifyScheduledDeflectionSnapshot(item.effectiveLoad());
}
