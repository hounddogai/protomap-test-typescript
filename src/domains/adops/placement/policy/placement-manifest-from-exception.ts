import { classifyGlobalPacingAllocation } from "../../pacing/exception/global-pacing-allocation-policy.js";
import { WeightedPacingException } from "../../pacing/exception/weighted-pacing-exception.js";
import { PlacementManifest, newPlacementManifest } from "./placement-manifest.js";

export function summarizeWeightedPacingExceptionsForManifest(items: WeightedPacingException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePlacementManifestsFromException(items: WeightedPacingException[]): PlacementManifest[] {
  const out: PlacementManifest[] = [];
  for (const item of items) {
    const derived = newPlacementManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPlacementManifest(item: PlacementManifest): string {
  return classifyGlobalPacingAllocation(item.adjustedValue());
}
