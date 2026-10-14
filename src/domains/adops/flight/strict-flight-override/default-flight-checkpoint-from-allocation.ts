import { regionalPlacementAllocationWeight } from "../../placement/snapshot/regional-placement-allocation-policy.js";
import { RegionalPlacementAllocation } from "../../placement/snapshot/regional-placement-allocation.js";
import { DefaultFlightCheckpoint, newDefaultFlightCheckpoint } from "./default-flight-checkpoint.js";

export function summarizeRegionalPlacementAllocationsForCheckpoint(items: RegionalPlacementAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveDefaultFlightCheckpointsFromAllocation(items: RegionalPlacementAllocation[]): DefaultFlightCheckpoint[] {
  const out: DefaultFlightCheckpoint[] = [];
  for (const item of items) {
    const derived = newDefaultFlightCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankDefaultFlightCheckpoint(item: DefaultFlightCheckpoint): number {
  return regionalPlacementAllocationWeight(3, true);
}
