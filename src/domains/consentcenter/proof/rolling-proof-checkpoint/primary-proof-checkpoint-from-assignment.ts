import { DoubleOptInAssignment } from "../../double-opt-in/assignment/double-opt-in-assignment.js";
import {
  regionalDoubleOptInMetricWeight,
} from "../../double-opt-in/assignment/regional-double-opt-in-metric-policy.js";
import { PrimaryProofCheckpoint, newPrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

export function summarizeDoubleOptInAssignmentsForCheckpoint(items: DoubleOptInAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePrimaryProofCheckpointsFromAssignment(items: DoubleOptInAssignment[]): PrimaryProofCheckpoint[] {
  const out: PrimaryProofCheckpoint[] = [];
  for (const item of items) {
    const derived = newPrimaryProofCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyPrimaryProofCheckpointExtra(item: PrimaryProofCheckpoint): number {
  return regionalDoubleOptInMetricWeight(2, true);
}
