import { deflectionDigestWeight } from "../segment/deflection-digest-policy.js";
import { DeflectionSegment } from "../segment/deflection-segment.js";
import { DeflectionAssignment, newDeflectionAssignment } from "./deflection-assignment.js";

export function summarizeDeflectionSegmentsForAssignment(items: DeflectionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveDeflectionAssignmentsFromSegment(items: DeflectionSegment[]): DeflectionAssignment[] {
  const out: DeflectionAssignment[] = [];
  for (const item of items) {
    const derived = newDeflectionAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignDeflectionAssignment(item: DeflectionAssignment): number {
  return deflectionDigestWeight(3, true);
}
