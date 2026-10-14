import { seasonalWarmupCheckpointBucket } from "../../warmup/tier/seasonal-warmup-checkpoint-policy.js";
import { SeasonalWarmupCheckpoint } from "../../warmup/tier/seasonal-warmup-checkpoint.js";
import { PendingReputationMapping, newPendingReputationMapping } from "./pending-reputation-mapping.js";

export function summarizeSeasonalWarmupCheckpointsForMapping(items: SeasonalWarmupCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePendingReputationMappingsFromCheckpoint(items: SeasonalWarmupCheckpoint[]): PendingReputationMapping[] {
  const out: PendingReputationMapping[] = [];
  for (const item of items) {
    const derived = newPendingReputationMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planPendingReputationMapping(item: PendingReputationMapping): string {
  return seasonalWarmupCheckpointBucket(item.measuredValue());
}
