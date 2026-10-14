import { placementBatchBucket } from "../segment/placement-batch-policy.js";
import { PlacementBatch } from "../segment/placement-batch.js";
import { PrimaryPlacementCheckpoint, newPrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

export function summarizePlacementBatchesForCheckpoint(items: PlacementBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePrimaryPlacementCheckpointsFromBatch(items: PlacementBatch[]): PrimaryPlacementCheckpoint[] {
  const out: PrimaryPlacementCheckpoint[] = [];
  for (const item of items) {
    const derived = newPrimaryPlacementCheckpoint(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryPlacementCheckpoint(item: PrimaryPlacementCheckpoint): string {
  return placementBatchBucket(item.weightedLoad());
}
