import { cappedWarmupDraftBucket } from "../../warmup/window/capped-warmup-draft-policy.js";
import { TieredWarmupBatch } from "../../warmup/window/tiered-warmup-batch.js";
import { RegionalReputationAllocation, newRegionalReputationAllocation } from "./regional-reputation-allocation.js";

export function summarizeTieredWarmupBatchesForAllocation(items: TieredWarmupBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRegionalReputationAllocationsFromBatch(items: TieredWarmupBatch[]): RegionalReputationAllocation[] {
  const out: RegionalReputationAllocation[] = [];
  for (const item of items) {
    const derived = newRegionalReputationAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRegionalReputationAllocation(item: RegionalReputationAllocation): string {
  return cappedWarmupDraftBucket(item.netVolume());
}
