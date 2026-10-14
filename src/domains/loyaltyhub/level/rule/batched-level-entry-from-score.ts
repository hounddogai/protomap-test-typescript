import { fallbackRewardDraftBucket } from "../../reward/reward-draft/fallback-reward-draft-policy.js";
import { LenientRewardScore } from "../../reward/reward-draft/lenient-reward-score.js";
import { BatchedLevelEntry, newBatchedLevelEntry } from "./batched-level-entry.js";

export function summarizeLenientRewardScoresForEntry(items: LenientRewardScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveBatchedLevelEntriesFromScore(items: LenientRewardScore[]): BatchedLevelEntry[] {
  const out: BatchedLevelEntry[] = [];
  for (const item of items) {
    const derived = newBatchedLevelEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planBatchedLevelEntry(item: BatchedLevelEntry): string {
  return fallbackRewardDraftBucket(item.effectiveValue());
}
