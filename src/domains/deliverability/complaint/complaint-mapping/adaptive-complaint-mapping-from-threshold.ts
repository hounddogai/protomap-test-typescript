import { batchedWarmupAssignmentWeight } from "../../warmup/warmup-threshold/batched-warmup-assignment-policy.js";
import { WeightedWarmupThreshold } from "../../warmup/warmup-threshold/weighted-warmup-threshold.js";
import { AdaptiveComplaintMapping, newAdaptiveComplaintMapping } from "./adaptive-complaint-mapping.js";

export function summarizeWeightedWarmupThresholdsForMapping(items: WeightedWarmupThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveAdaptiveComplaintMappingsFromThreshold(items: WeightedWarmupThreshold[]): AdaptiveComplaintMapping[] {
  const out: AdaptiveComplaintMapping[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateAdaptiveComplaintMapping(item: AdaptiveComplaintMapping): number {
  return batchedWarmupAssignmentWeight(3, true);
}
