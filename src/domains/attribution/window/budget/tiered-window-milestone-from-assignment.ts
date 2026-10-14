import { classifyAdaptiveCreditNotice } from "../../credit/credit-notice/adaptive-credit-notice-policy.js";
import { CreditAssignment } from "../../credit/credit-notice/credit-assignment.js";
import { TieredWindowMilestone, newTieredWindowMilestone } from "./tiered-window-milestone.js";

export function summarizeCreditAssignmentsForMilestone(items: CreditAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveTieredWindowMilestonesFromAssignment(items: CreditAssignment[]): TieredWindowMilestone[] {
  const out: TieredWindowMilestone[] = [];
  for (const item of items) {
    const derived = newTieredWindowMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyTieredWindowMilestone(item: TieredWindowMilestone): string {
  return classifyAdaptiveCreditNotice(item.weightedLoad());
}
