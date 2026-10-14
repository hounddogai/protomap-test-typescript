import { adaptiveWindowGroupBucket } from "../../window/override-item/adaptive-window-group-policy.js";
import { AdaptiveWindowGroup } from "../../window/override-item/adaptive-window-group.js";
import { LenientTouchpointVariance, newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

export function summarizeAdaptiveWindowGroupsForVariance(items: AdaptiveWindowGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLenientTouchpointVariancesFromGroup(items: AdaptiveWindowGroup[]): LenientTouchpointVariance[] {
  const out: LenientTouchpointVariance[] = [];
  for (const item of items) {
    const derived = newLenientTouchpointVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLenientTouchpointVariance(item: LenientTouchpointVariance): string {
  return adaptiveWindowGroupBucket(item.weightedExposure());
}
