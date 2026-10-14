import { batchedFlightCheckpointWeight } from "../../flight/record-item/batched-flight-checkpoint-policy.js";
import { FlightMilestone } from "../../flight/record-item/flight-milestone.js";
import { WeightedPacingThreshold, newWeightedPacingThreshold } from "./weighted-pacing-threshold.js";

export function summarizeFlightMilestonesForThreshold(items: FlightMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveWeightedPacingThresholdsFromMilestone(items: FlightMilestone[]): WeightedPacingThreshold[] {
  const out: WeightedPacingThreshold[] = [];
  for (const item of items) {
    const derived = newWeightedPacingThreshold(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWeightedPacingThreshold(item: WeightedPacingThreshold): number {
  return batchedFlightCheckpointWeight(6, true);
}
