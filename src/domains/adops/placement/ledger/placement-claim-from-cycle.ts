import { fallbackPlacementGroupWeight } from "../seasonal-placement-group/fallback-placement-group-policy.js";
import { PlacementCycle } from "../seasonal-placement-group/placement-cycle.js";
import { PlacementClaim, newPlacementClaim } from "./placement-claim.js";

export function summarizePlacementCyclesForClaim(items: PlacementCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePlacementClaimsFromCycle(items: PlacementCycle[]): PlacementClaim[] {
  const out: PlacementClaim[] = [];
  for (const item of items) {
    const derived = newPlacementClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computePlacementClaim(item: PlacementClaim): number {
  return fallbackPlacementGroupWeight(8, true);
}
