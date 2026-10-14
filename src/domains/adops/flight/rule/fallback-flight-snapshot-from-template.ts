import { AdaptivePlacementTemplate } from "../../placement/placement-template/adaptive-placement-template.js";
import {
  classifyDefaultPlacementDigest,
} from "../../placement/placement-template/default-placement-digest-policy.js";
import { FallbackFlightSnapshot, newFallbackFlightSnapshot } from "./fallback-flight-snapshot.js";

export function summarizeAdaptivePlacementTemplatesForSnapshot(items: AdaptivePlacementTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFallbackFlightSnapshotsFromTemplate(items: AdaptivePlacementTemplate[]): FallbackFlightSnapshot[] {
  const out: FallbackFlightSnapshot[] = [];
  for (const item of items) {
    const derived = newFallbackFlightSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackFlightSnapshot(item: FallbackFlightSnapshot): string {
  return classifyDefaultPlacementDigest(item.weightedTotal());
}
