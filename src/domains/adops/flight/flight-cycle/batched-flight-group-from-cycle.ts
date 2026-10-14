import {
  fallbackPlacementGroupWeight,
} from "../../placement/seasonal-placement-group/fallback-placement-group-policy.js";
import { PlacementCycle } from "../../placement/seasonal-placement-group/placement-cycle.js";
import { BatchedFlightGroup, newBatchedFlightGroup } from "./batched-flight-group.js";

export function summarizePlacementCyclesForGroup(items: PlacementCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBatchedFlightGroupsFromCycle(items: PlacementCycle[]): BatchedFlightGroup[] {
  const out: BatchedFlightGroup[] = [];
  for (const item of items) {
    const derived = newBatchedFlightGroup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBatchedFlightGroup(item: BatchedFlightGroup): number {
  return fallbackPlacementGroupWeight(3, true);
}
