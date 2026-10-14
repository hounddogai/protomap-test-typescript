import { GlobalDeflectionCheckpoint } from "../deflection-slot/global-deflection-checkpoint.js";
import { scheduledDeflectionSlotBucket } from "../deflection-slot/scheduled-deflection-slot-policy.js";
import { WeightedDeflectionAssignment, newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

export function summarizeGlobalDeflectionCheckpointsForAssignment(items: GlobalDeflectionCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWeightedDeflectionAssignmentsFromCheckpoint(items: GlobalDeflectionCheckpoint[]): WeightedDeflectionAssignment[] {
  const out: WeightedDeflectionAssignment[] = [];
  for (const item of items) {
    const derived = newWeightedDeflectionAssignment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWeightedDeflectionAssignment(item: WeightedDeflectionAssignment): string {
  return scheduledDeflectionSlotBucket(item.netExposure());
}
