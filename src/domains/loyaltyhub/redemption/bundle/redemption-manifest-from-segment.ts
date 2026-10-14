import { AdaptiveLevelSegment } from "../../level/mapping/adaptive-level-segment.js";
import { classifyLevelBundle } from "../../level/mapping/level-bundle-policy.js";
import { RedemptionManifest, newRedemptionManifest } from "./redemption-manifest.js";

export function summarizeAdaptiveLevelSegmentsForManifest(items: AdaptiveLevelSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRedemptionManifestsFromSegment(items: AdaptiveLevelSegment[]): RedemptionManifest[] {
  const out: RedemptionManifest[] = [];
  for (const item of items) {
    const derived = newRedemptionManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRedemptionManifest(item: RedemptionManifest): string {
  return classifyLevelBundle(item.weightedTotal());
}
