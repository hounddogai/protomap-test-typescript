import { classifyWeightedTouchpointEstimate } from "../../touchpoint/estimate/weighted-touchpoint-estimate-policy.js";
import { WeightedTouchpointEstimate } from "../../touchpoint/estimate/weighted-touchpoint-estimate.js";
import { PrimaryModelPlan, newPrimaryModelPlan } from "./primary-model-plan.js";

export function summarizeWeightedTouchpointEstimatesForPlan(items: WeightedTouchpointEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryModelPlansFromEstimate(items: WeightedTouchpointEstimate[]): PrimaryModelPlan[] {
  const out: PrimaryModelPlan[] = [];
  for (const item of items) {
    const derived = newPrimaryModelPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryModelPlan(item: PrimaryModelPlan): string {
  return classifyWeightedTouchpointEstimate(item.measuredValue());
}
