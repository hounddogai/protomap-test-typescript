import { PendingWindowManifest } from "../../window/window-manifest/pending-window-manifest.js";
import { classifyWindowSnapshot } from "../../window/window-manifest/window-snapshot-policy.js";
import { ModelMetric, newModelMetric } from "./model-metric.js";

export function summarizePendingWindowManifestsForMetric(items: PendingWindowManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveModelMetricsFromManifest(items: PendingWindowManifest[]): ModelMetric[] {
  const out: ModelMetric[] = [];
  for (const item of items) {
    const derived = newModelMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankModelMetric(item: ModelMetric): string {
  return classifyWindowSnapshot(item.effectiveExposure());
}
