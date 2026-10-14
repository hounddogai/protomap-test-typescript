import { pathMetricWeight } from "../../path/path-milestone/path-metric-policy.js";
import { PathWindow } from "../../path/path-milestone/path-window.js";
import { PendingConversionCheckpoint, newPendingConversionCheckpoint } from "./pending-conversion-checkpoint.js";

export function summarizePathWindowsForCheckpoint(items: PathWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function derivePendingConversionCheckpointsFromWindow(items: PathWindow[]): PendingConversionCheckpoint[] {
  const out: PendingConversionCheckpoint[] = [];
  for (const item of items) {
    const derived = newPendingConversionCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingConversionCheckpoint(item: PendingConversionCheckpoint): number {
  return pathMetricWeight(5, true);
}
