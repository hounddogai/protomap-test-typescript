import { CappedTierVariance } from "../../tier/tier-variance/capped-tier-variance.js";
import { classifyTieredTierBaseline } from "../../tier/tier-variance/tiered-tier-baseline-policy.js";
import { PendingRewardRulePlan, newPendingRewardRulePlan } from "./pending-reward-rule-plan.js";

export function summarizeCappedTierVariancesForPlan(items: CappedTierVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePendingRewardRulePlansFromVariance(items: CappedTierVariance[]): PendingRewardRulePlan[] {
  const out: PendingRewardRulePlan[] = [];
  for (const item of items) {
    const derived = newPendingRewardRulePlan(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingRewardRulePlan(item: PendingRewardRulePlan): string {
  return classifyTieredTierBaseline(item.measuredValue());
}
