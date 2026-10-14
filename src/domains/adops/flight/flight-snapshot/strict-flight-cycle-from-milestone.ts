import { batchedFlightCheckpointBucket } from "../record-item/batched-flight-checkpoint-policy.js";
import { FlightMilestone } from "../record-item/flight-milestone.js";
import { StrictFlightCycle, newStrictFlightCycle } from "./strict-flight-cycle.js";

export function summarizeFlightMilestonesForCycle(items: FlightMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStrictFlightCyclesFromMilestone(items: FlightMilestone[]): StrictFlightCycle[] {
  const out: StrictFlightCycle[] = [];
  for (const item of items) {
    const derived = newStrictFlightCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStrictFlightCycle(item: StrictFlightCycle): string {
  return batchedFlightCheckpointBucket(item.adjustedValue());
}
