import { classifyWindowSnapshot } from "../../window/window-manifest/window-snapshot-policy.js";
import { WindowSnapshot } from "../../window/window-manifest/window-snapshot.js";
import { PathThreshold, newPathThreshold } from "./path-threshold.js";

export function summarizeWindowSnapshotsForThreshold(items: WindowSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePathThresholdsFromSnapshot(items: WindowSnapshot[]): PathThreshold[] {
  const out: PathThreshold[] = [];
  for (const item of items) {
    const derived = newPathThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPathThreshold(item: PathThreshold): string {
  return classifyWindowSnapshot(item.effectiveLoad());
}
