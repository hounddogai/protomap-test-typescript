import { primaryTouchpointTargetWeight } from "../../touchpoint/preference/primary-touchpoint-target-policy.js";
import { TouchpointTarget } from "../../touchpoint/preference/touchpoint-target.js";
import { CreditMilestone, newCreditMilestone } from "./credit-milestone.js";

export function summarizeTouchpointTargetsForMilestone(items: TouchpointTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveCreditMilestonesFromTarget(items: TouchpointTarget[]): CreditMilestone[] {
  const out: CreditMilestone[] = [];
  for (const item of items) {
    const derived = newCreditMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceCreditMilestone(item: CreditMilestone): number {
  return primaryTouchpointTargetWeight(5, true);
}
