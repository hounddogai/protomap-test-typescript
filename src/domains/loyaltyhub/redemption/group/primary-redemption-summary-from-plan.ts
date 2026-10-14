import { BadgePlan } from "../../badge/badge-digest/badge-plan.js";
import { regionalBadgeDigestWeight } from "../../badge/badge-digest/regional-badge-digest-policy.js";
import { PrimaryRedemptionSummary, newPrimaryRedemptionSummary } from "./primary-redemption-summary.js";

export function summarizeBadgePlansForSummary(items: BadgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryRedemptionSummariesFromPlan(items: BadgePlan[]): PrimaryRedemptionSummary[] {
  const out: PrimaryRedemptionSummary[] = [];
  for (const item of items) {
    const derived = newPrimaryRedemptionSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryRedemptionSummary(item: PrimaryRedemptionSummary): number {
  return regionalBadgeDigestWeight(6, true);
}
