import { ScheduledTierLedger } from "../../tier/adjustment/scheduled-tier-ledger.js";
import { classifyTierAdjustment } from "../../tier/adjustment/tier-adjustment-policy.js";
import { WeightedRewardRuleAgreement, newWeightedRewardRuleAgreement } from "./weighted-reward-rule-agreement.js";

export function summarizeScheduledTierLedgersForAgreement(items: ScheduledTierLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedRewardRuleAgreementsFromLedger(items: ScheduledTierLedger[]): WeightedRewardRuleAgreement[] {
  const out: WeightedRewardRuleAgreement[] = [];
  for (const item of items) {
    const derived = newWeightedRewardRuleAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedRewardRuleAgreement(item: WeightedRewardRuleAgreement): string {
  return classifyTierAdjustment(item.netTotal());
}
