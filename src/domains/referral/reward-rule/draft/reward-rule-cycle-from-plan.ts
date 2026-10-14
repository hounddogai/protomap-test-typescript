import { PendingRewardRulePlan } from "../ledger/pending-reward-rule-plan.js";
import { rollingRewardRuleLedgerWeight } from "../ledger/rolling-reward-rule-ledger-policy.js";
import { RewardRuleCycle, newRewardRuleCycle } from "./reward-rule-cycle.js";

export function summarizePendingRewardRulePlansForCycle(items: PendingRewardRulePlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardRuleCyclesFromPlan(items: PendingRewardRulePlan[]): RewardRuleCycle[] {
  const out: RewardRuleCycle[] = [];
  for (const item of items) {
    const derived = newRewardRuleCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankRewardRuleCycle(item: RewardRuleCycle): number {
  return rollingRewardRuleLedgerWeight(8, true);
}
