import { seasonalWarmupCheckpointBucket } from "../../warmup/tier/seasonal-warmup-checkpoint-policy.js";
import { SeasonalWarmupCheckpoint } from "../../warmup/tier/seasonal-warmup-checkpoint.js";
import { FallbackSenderBundle, newFallbackSenderBundle } from "./fallback-sender-bundle.js";

export function summarizeSeasonalWarmupCheckpointsForBundle(items: SeasonalWarmupCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveFallbackSenderBundlesFromCheckpoint(items: SeasonalWarmupCheckpoint[]): FallbackSenderBundle[] {
  const out: FallbackSenderBundle[] = [];
  for (const item of items) {
    const derived = newFallbackSenderBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFallbackSenderBundle(item: FallbackSenderBundle): string {
  return seasonalWarmupCheckpointBucket(item.weightedExposure());
}
