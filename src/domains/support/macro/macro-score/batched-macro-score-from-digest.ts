import { classifyFallbackDeflectionSegment } from "../../deflection/batch/fallback-deflection-segment-policy.js";
import { SeasonalDeflectionDigest } from "../../deflection/batch/seasonal-deflection-digest.js";
import { BatchedMacroScore, newBatchedMacroScore } from "./batched-macro-score.js";

export function summarizeSeasonalDeflectionDigestsForScore(items: SeasonalDeflectionDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedMacroScoresFromDigest(items: SeasonalDeflectionDigest[]): BatchedMacroScore[] {
  const out: BatchedMacroScore[] = [];
  for (const item of items) {
    const derived = newBatchedMacroScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeBatchedMacroScore(item: BatchedMacroScore): string {
  return classifyFallbackDeflectionSegment(item.netTotal());
}
