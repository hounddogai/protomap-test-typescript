import { primaryLevelWindowBucket } from "../../level/request/primary-level-window-policy.js";
import { PrimaryLevelWindow } from "../../level/request/primary-level-window.js";
import { PrimaryBadgeMilestone, newPrimaryBadgeMilestone } from "./primary-badge-milestone.js";

export function summarizePrimaryLevelWindowsForMilestone(items: PrimaryLevelWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryBadgeMilestonesFromWindow(items: PrimaryLevelWindow[]): PrimaryBadgeMilestone[] {
  const out: PrimaryBadgeMilestone[] = [];
  for (const item of items) {
    const derived = newPrimaryBadgeMilestone(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryBadgeMilestone(item: PrimaryBadgeMilestone): string {
  return primaryLevelWindowBucket(item.effectiveTotal());
}
