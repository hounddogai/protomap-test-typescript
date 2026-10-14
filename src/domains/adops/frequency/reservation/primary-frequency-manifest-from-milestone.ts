import { batchedFlightCheckpointBucket } from "../../flight/record-item/batched-flight-checkpoint-policy.js";
import { FlightMilestone } from "../../flight/record-item/flight-milestone.js";
import { PrimaryFrequencyManifest, newPrimaryFrequencyManifest } from "./primary-frequency-manifest.js";

export function summarizeFlightMilestonesForManifest(items: FlightMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePrimaryFrequencyManifestsFromMilestone(items: FlightMilestone[]): PrimaryFrequencyManifest[] {
  const out: PrimaryFrequencyManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryFrequencyManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryFrequencyManifest(item: PrimaryFrequencyManifest): string {
  return batchedFlightCheckpointBucket(item.weightedTotal());
}
