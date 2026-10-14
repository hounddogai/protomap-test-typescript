import {
  normalizePrimaryRedemptionVarianceCode,
} from "../../redemption/variance/primary-redemption-variance-policy.js";
import { PrimaryRedemptionVariance } from "../../redemption/variance/primary-redemption-variance.js";
import { StrictBadgePlan, newStrictBadgePlan } from "./strict-badge-plan.js";

export function summarizePrimaryRedemptionVariancesForPlan(items: PrimaryRedemptionVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveStrictBadgePlansFromVariance(items: PrimaryRedemptionVariance[]): StrictBadgePlan[] {
  const out: StrictBadgePlan[] = [];
  for (const item of items) {
    const derived = newStrictBadgePlan(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankStrictBadgePlan(item: StrictBadgePlan): string {
  return normalizePrimaryRedemptionVarianceCode(item.code);
}
