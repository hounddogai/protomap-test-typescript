import { placementTierWeight } from "../../placement/assignment/placement-tier-policy.js";
import { TieredPlacementException } from "../../placement/assignment/tiered-placement-exception.js";
import { FrequencyException, newFrequencyException } from "./frequency-exception.js";

export function summarizeTieredPlacementExceptionsForException(items: TieredPlacementException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveFrequencyExceptionsFromException(items: TieredPlacementException[]): FrequencyException[] {
  const out: FrequencyException[] = [];
  for (const item of items) {
    const derived = newFrequencyException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeFrequencyException(item: FrequencyException): number {
  return placementTierWeight(8, true);
}
