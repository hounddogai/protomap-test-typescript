import { AdaptivePayoutAssignment } from "../assignment/adaptive-payout-assignment.js";
import { defaultPayoutTargetWeight } from "../assignment/default-payout-target-policy.js";
import { StrictPayoutAssignment, newStrictPayoutAssignment } from "./strict-payout-assignment.js";

export function summarizeAdaptivePayoutAssignmentsForAssignment(items: AdaptivePayoutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveStrictPayoutAssignmentsFromAssignment(items: AdaptivePayoutAssignment[]): StrictPayoutAssignment[] {
  const out: StrictPayoutAssignment[] = [];
  for (const item of items) {
    const derived = newStrictPayoutAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyStrictPayoutAssignment(item: StrictPayoutAssignment): number {
  return defaultPayoutTargetWeight(5, true);
}
