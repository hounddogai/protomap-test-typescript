import { normalizePendingCohortVarianceCode } from "../../cohort/variance/pending-cohort-variance-policy.js";
import { StrictCohortAssignment } from "../../cohort/variance/strict-cohort-assignment.js";
import { GlobalRetentionCheckpoint, newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

export function summarizeStrictCohortAssignmentsForCheckpoint(items: StrictCohortAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveGlobalRetentionCheckpointsFromAssignment(items: StrictCohortAssignment[]): GlobalRetentionCheckpoint[] {
  const out: GlobalRetentionCheckpoint[] = [];
  for (const item of items) {
    const derived = newGlobalRetentionCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceGlobalRetentionCheckpoint(item: GlobalRetentionCheckpoint): string {
  return normalizePendingCohortVarianceCode(item.code);
}
