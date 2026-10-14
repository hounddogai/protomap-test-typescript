import { placementSummaryBucket } from "../placement-slot/placement-summary-policy.js";
import { TieredPlacementSlot } from "../placement-slot/tiered-placement-slot.js";
import { FallbackPlacementGroup, newFallbackPlacementGroup } from "./fallback-placement-group.js";

export function summarizeTieredPlacementSlotsForGroup(items: TieredPlacementSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveFallbackPlacementGroupsFromSlot(items: TieredPlacementSlot[]): FallbackPlacementGroup[] {
  const out: FallbackPlacementGroup[] = [];
  for (const item of items) {
    const derived = newFallbackPlacementGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyFallbackPlacementGroup(item: FallbackPlacementGroup): string {
  return placementSummaryBucket(item.adjustedExposure());
}
