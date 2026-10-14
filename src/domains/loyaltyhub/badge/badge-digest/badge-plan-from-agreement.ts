import { classifyManualRedemptionAgreement } from "../../redemption/adjustment/manual-redemption-agreement-policy.js";
import { StrictRedemptionAgreement } from "../../redemption/adjustment/strict-redemption-agreement.js";
import { BadgePlan, newBadgePlan } from "./badge-plan.js";

export function summarizeStrictRedemptionAgreementsForPlan(items: StrictRedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBadgePlansFromAgreement(items: StrictRedemptionAgreement[]): BadgePlan[] {
  const out: BadgePlan[] = [];
  for (const item of items) {
    const derived = newBadgePlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignBadgePlan(item: BadgePlan): string {
  return classifyManualRedemptionAgreement(item.measuredValue());
}
