import { pathVarianceWeight } from "../../path/variance/path-variance-policy.js";
import { PathVariance } from "../../path/variance/path-variance.js";
import { WeightedTouchpointEstimate, newWeightedTouchpointEstimate } from "./weighted-touchpoint-estimate.js";

export function summarizePathVariancesForEstimate(items: PathVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWeightedTouchpointEstimatesFromVariance(items: PathVariance[]): WeightedTouchpointEstimate[] {
  const out: WeightedTouchpointEstimate[] = [];
  for (const item of items) {
    const derived = newWeightedTouchpointEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedTouchpointEstimate(item: WeightedTouchpointEstimate): number {
  return pathVarianceWeight(8, true);
}
