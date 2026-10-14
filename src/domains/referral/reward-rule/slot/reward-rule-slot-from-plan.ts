import { fraudCheckPlanBucket } from "../../fraud-check/plan/fraud-check-plan-policy.js";
import { FraudCheckPlan } from "../../fraud-check/plan/fraud-check-plan.js";
import { RewardRuleSlot, newRewardRuleSlot } from "./reward-rule-slot.js";

export function summarizeFraudCheckPlansForSlot(items: FraudCheckPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveRewardRuleSlotsFromPlan(items: FraudCheckPlan[]): RewardRuleSlot[] {
  const out: RewardRuleSlot[] = [];
  for (const item of items) {
    const derived = newRewardRuleSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRewardRuleSlot(item: RewardRuleSlot): string {
  return fraudCheckPlanBucket(item.weightedTotal());
}
