import { classifyLegacyStreakManifest } from "../../streak/manifest/legacy-streak-manifest-policy.js";
import { LegacyStreakManifest } from "../../streak/manifest/legacy-streak-manifest.js";
import { BatchedLevelEstimate, newBatchedLevelEstimate } from "./batched-level-estimate.js";

export function summarizeLegacyStreakManifestsForEstimate(items: LegacyStreakManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBatchedLevelEstimatesFromManifest(items: LegacyStreakManifest[]): BatchedLevelEstimate[] {
  const out: BatchedLevelEstimate[] = [];
  for (const item of items) {
    const derived = newBatchedLevelEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedLevelEstimate(item: BatchedLevelEstimate): string {
  return classifyLegacyStreakManifest(item.measuredValue());
}
