import { strictWindowPreferenceWeight } from "../../window/audit/strict-window-preference-policy.js";
import { WindowAssignment } from "../../window/audit/window-assignment.js";
import { BatchedPathProfile, newBatchedPathProfile } from "./batched-path-profile.js";

export function summarizeWindowAssignmentsForProfile(items: WindowAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBatchedPathProfilesFromAssignment(items: WindowAssignment[]): BatchedPathProfile[] {
  const out: BatchedPathProfile[] = [];
  for (const item of items) {
    const derived = newBatchedPathProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedPathProfile(item: BatchedPathProfile): number {
  return strictWindowPreferenceWeight(7, true);
}
