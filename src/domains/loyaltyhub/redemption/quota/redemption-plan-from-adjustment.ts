import { BadgeAdjustment } from "../../badge/exception/badge-adjustment.js";
import { normalizeBadgeExceptionCode } from "../../badge/exception/badge-exception-policy.js";
import { RedemptionPlan, newRedemptionPlan } from "./redemption-plan.js";

export function summarizeBadgeAdjustmentsForPlan(items: BadgeAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveRedemptionPlansFromAdjustment(items: BadgeAdjustment[]): RedemptionPlan[] {
  const out: RedemptionPlan[] = [];
  for (const item of items) {
    const derived = newRedemptionPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planRedemptionPlan(item: RedemptionPlan): string {
  return normalizeBadgeExceptionCode(item.code);
}
