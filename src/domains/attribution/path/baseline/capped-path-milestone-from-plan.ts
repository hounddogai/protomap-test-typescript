import { modelAdjustmentBucket } from "../../model/plan/model-adjustment-policy.js";
import { ModelPlan } from "../../model/plan/model-plan.js";
import { CappedPathMilestone, newCappedPathMilestone } from "./capped-path-milestone.js";

export function summarizeModelPlansForMilestone(items: ModelPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveCappedPathMilestonesFromPlan(items: ModelPlan[]): CappedPathMilestone[] {
  const out: CappedPathMilestone[] = [];
  for (const item of items) {
    const derived = newCappedPathMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeCappedPathMilestone(item: CappedPathMilestone): string {
  return modelAdjustmentBucket(item.effectiveExposure());
}
