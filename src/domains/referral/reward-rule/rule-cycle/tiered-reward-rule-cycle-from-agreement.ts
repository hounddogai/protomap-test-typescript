import { fallbackFraudCheckWindowWeight } from "../../fraud-check/window/fallback-fraud-check-window-policy.js";
import { ManualFraudCheckAgreement } from "../../fraud-check/window/manual-fraud-check-agreement.js";
import { TieredRewardRuleCycle, newTieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

export function summarizeManualFraudCheckAgreementsForCycle(items: ManualFraudCheckAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredRewardRuleCyclesFromAgreement(items: ManualFraudCheckAgreement[]): TieredRewardRuleCycle[] {
  const out: TieredRewardRuleCycle[] = [];
  for (const item of items) {
    const derived = newTieredRewardRuleCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectTieredRewardRuleCycle(item: TieredRewardRuleCycle): number {
  return fallbackFraudCheckWindowWeight(6, true);
}
