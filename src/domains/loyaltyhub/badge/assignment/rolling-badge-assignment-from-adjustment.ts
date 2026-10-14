import { ManualBadgeAdjustment } from "../badge-template/manual-badge-adjustment.js";
import { manualBadgeTierWeight } from "../badge-template/manual-badge-tier-policy.js";
import { RollingBadgeAssignment, newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

export function summarizeManualBadgeAdjustmentsForAssignment(items: ManualBadgeAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingBadgeAssignmentsFromAdjustment(items: ManualBadgeAdjustment[]): RollingBadgeAssignment[] {
  const out: RollingBadgeAssignment[] = [];
  for (const item of items) {
    const derived = newRollingBadgeAssignment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectRollingBadgeAssignment(item: RollingBadgeAssignment): number {
  return manualBadgeTierWeight(5, true);
}
