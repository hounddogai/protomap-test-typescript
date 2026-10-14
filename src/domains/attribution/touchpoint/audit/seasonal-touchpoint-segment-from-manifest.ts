import { cappedTouchpointManifestBucket } from "../touchpoint-preference/capped-touchpoint-manifest-policy.js";
import { CappedTouchpointManifest } from "../touchpoint-preference/capped-touchpoint-manifest.js";
import { SeasonalTouchpointSegment, newSeasonalTouchpointSegment } from "./seasonal-touchpoint-segment.js";

export function summarizeCappedTouchpointManifestsForSegment(items: CappedTouchpointManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveSeasonalTouchpointSegmentsFromManifest(items: CappedTouchpointManifest[]): SeasonalTouchpointSegment[] {
  const out: SeasonalTouchpointSegment[] = [];
  for (const item of items) {
    const derived = newSeasonalTouchpointSegment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSeasonalTouchpointSegment(item: SeasonalTouchpointSegment): string {
  return cappedTouchpointManifestBucket(item.weightedLoad());
}
