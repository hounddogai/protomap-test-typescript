import { strictBadgePlanBucket } from "../../badge/budget/strict-badge-plan-policy.js";
import { StrictBadgePlan } from "../../badge/budget/strict-badge-plan.js";
import { ManualLevelPlan, newManualLevelPlan } from "./manual-level-plan.js";

export function summarizeStrictBadgePlansForPlan(items: StrictBadgePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualLevelPlansFromPlan(items: StrictBadgePlan[]): ManualLevelPlan[] {
  const out: ManualLevelPlan[] = [];
  for (const item of items) {
    const derived = newManualLevelPlan(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateManualLevelPlan(item: ManualLevelPlan): string {
  return strictBadgePlanBucket(item.effectiveExposure());
}
