import { BadgeVariance } from "../../badge/badge-baseline/badge-variance.js";
import { classifyGlobalBadgeBaseline } from "../../badge/badge-baseline/global-badge-baseline-policy.js";
import { ManualRedemptionAssignment, newManualRedemptionAssignment } from "./manual-redemption-assignment.js";

export function summarizeBadgeVariancesForAssignment(items: BadgeVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveManualRedemptionAssignmentsFromVariance(items: BadgeVariance[]): ManualRedemptionAssignment[] {
  const out: ManualRedemptionAssignment[] = [];
  for (const item of items) {
    const derived = newManualRedemptionAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualRedemptionAssignment(item: ManualRedemptionAssignment): string {
  return classifyGlobalBadgeBaseline(item.netTotal());
}
