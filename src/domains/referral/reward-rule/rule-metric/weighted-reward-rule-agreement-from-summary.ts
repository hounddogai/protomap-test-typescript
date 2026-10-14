import { fallbackRewardRuleRequestWeight } from "../rule-summary/fallback-reward-rule-request-policy.js";
import { ScheduledRewardRuleSummary } from "../rule-summary/scheduled-reward-rule-summary.js";
import { WeightedRewardRuleAgreement, newWeightedRewardRuleAgreement } from "./weighted-reward-rule-agreement.js";

export function summarizeScheduledRewardRuleSummariesForAgreement(items: ScheduledRewardRuleSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveWeightedRewardRuleAgreementsFromSummary(items: ScheduledRewardRuleSummary[]): WeightedRewardRuleAgreement[] {
  const out: WeightedRewardRuleAgreement[] = [];
  for (const item of items) {
    const derived = newWeightedRewardRuleAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveWeightedRewardRuleAgreement(item: WeightedRewardRuleAgreement): number {
  return fallbackRewardRuleRequestWeight(7, true);
}
