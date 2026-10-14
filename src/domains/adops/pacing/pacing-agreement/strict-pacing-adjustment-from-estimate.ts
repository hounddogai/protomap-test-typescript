import { regionalPlacementAllocationWeight } from "../../placement/snapshot/regional-placement-allocation-policy.js";
import { WeightedPlacementEstimate } from "../../placement/snapshot/weighted-placement-estimate.js";
import { StrictPacingAdjustment, newStrictPacingAdjustment } from "./strict-pacing-adjustment.js";

export function summarizeWeightedPlacementEstimatesForAdjustment(items: WeightedPlacementEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveStrictPacingAdjustmentsFromEstimate(items: WeightedPlacementEstimate[]): StrictPacingAdjustment[] {
  const out: StrictPacingAdjustment[] = [];
  for (const item of items) {
    const derived = newStrictPacingAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStrictPacingAdjustment(item: StrictPacingAdjustment): number {
  return regionalPlacementAllocationWeight(4, true);
}
