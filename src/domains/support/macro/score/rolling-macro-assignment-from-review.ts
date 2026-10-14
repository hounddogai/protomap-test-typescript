import { BatchedDeflectionReview } from "../../deflection/deflection-snapshot/batched-deflection-review.js";
import { deflectionPreferenceBucket } from "../../deflection/deflection-snapshot/deflection-preference-policy.js";
import { RollingMacroAssignment, newRollingMacroAssignment } from "./rolling-macro-assignment.js";

export function summarizeBatchedDeflectionReviewsForAssignment(items: BatchedDeflectionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRollingMacroAssignmentsFromReview(items: BatchedDeflectionReview[]): RollingMacroAssignment[] {
  const out: RollingMacroAssignment[] = [];
  for (const item of items) {
    const derived = newRollingMacroAssignment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeRollingMacroAssignment(item: RollingMacroAssignment): string {
  return deflectionPreferenceBucket(item.projectedExposure());
}
