import { rewardRuleSlotWeight } from "../../reward-rule/slot/reward-rule-slot-policy.js";
import { RewardRuleSlot } from "../../reward-rule/slot/reward-rule-slot.js";
import { DefaultFraudCheckPlan, newDefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

export function summarizeRewardRuleSlotsForPlan(items: RewardRuleSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveDefaultFraudCheckPlansFromSlot(items: RewardRuleSlot[]): DefaultFraudCheckPlan[] {
  const out: DefaultFraudCheckPlan[] = [];
  for (const item of items) {
    const derived = newDefaultFraudCheckPlan(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignDefaultFraudCheckPlan(item: DefaultFraudCheckPlan): number {
  return rewardRuleSlotWeight(1, true);
}
