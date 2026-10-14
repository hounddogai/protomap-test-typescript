import { regionalPlacementAllocationBucket } from "../snapshot/regional-placement-allocation-policy.js";
import { WeightedPlacementEstimate } from "../snapshot/weighted-placement-estimate.js";
import { TieredPlacementRecord, newTieredPlacementRecord } from "./tiered-placement-record.js";

export function summarizeWeightedPlacementEstimatesForRecord(items: WeightedPlacementEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredPlacementRecordsFromEstimate(items: WeightedPlacementEstimate[]): TieredPlacementRecord[] {
  const out: TieredPlacementRecord[] = [];
  for (const item of items) {
    const derived = newTieredPlacementRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyTieredPlacementRecord(item: TieredPlacementRecord): string {
  return regionalPlacementAllocationBucket(item.weightedValue());
}
