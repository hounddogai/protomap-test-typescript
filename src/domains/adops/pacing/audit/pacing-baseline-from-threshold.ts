import { placementThresholdBucket } from "../../placement/threshold/placement-threshold-policy.js";
import { PlacementThreshold } from "../../placement/threshold/placement-threshold.js";
import { PacingBaseline, newPacingBaseline } from "./pacing-baseline.js";

export function summarizePlacementThresholdsForBaseline(items: PlacementThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePacingBaselinesFromThreshold(items: PlacementThreshold[]): PacingBaseline[] {
  const out: PacingBaseline[] = [];
  for (const item of items) {
    const derived = newPacingBaseline(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planPacingBaseline(item: PacingBaseline): string {
  return placementThresholdBucket(item.effectiveValue());
}
