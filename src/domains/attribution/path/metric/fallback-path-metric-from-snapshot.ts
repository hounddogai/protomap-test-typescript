import { normalizeCappedPathSnapshotCode } from "../path-allocation/capped-path-snapshot-policy.js";
import { CappedPathSnapshot } from "../path-allocation/capped-path-snapshot.js";
import { FallbackPathMetric, newFallbackPathMetric } from "./fallback-path-metric.js";

export function summarizeCappedPathSnapshotsForMetric(items: CappedPathSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackPathMetricsFromSnapshot(items: CappedPathSnapshot[]): FallbackPathMetric[] {
  const out: FallbackPathMetric[] = [];
  for (const item of items) {
    const derived = newFallbackPathMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateFallbackPathMetric(item: FallbackPathMetric): string {
  return normalizeCappedPathSnapshotCode(item.code);
}
