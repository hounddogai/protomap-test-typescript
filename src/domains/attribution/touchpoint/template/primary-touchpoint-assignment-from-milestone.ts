import { classifyRollingPathMilestone } from "../../path/path-milestone/rolling-path-milestone-policy.js";
import { RollingPathMilestone } from "../../path/path-milestone/rolling-path-milestone.js";
import { PrimaryTouchpointAssignment, newPrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

export function summarizeRollingPathMilestonesForAssignment(items: RollingPathMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePrimaryTouchpointAssignmentsFromMilestone(items: RollingPathMilestone[]): PrimaryTouchpointAssignment[] {
  const out: PrimaryTouchpointAssignment[] = [];
  for (const item of items) {
    const derived = newPrimaryTouchpointAssignment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchPrimaryTouchpointAssignment(item: PrimaryTouchpointAssignment): string {
  return classifyRollingPathMilestone(item.weightedVolume());
}
