import { classifyRewardRuleVariance } from "../../reward-rule/variance/reward-rule-variance-policy.js";
import { RewardRuleVariance } from "../../reward-rule/variance/reward-rule-variance.js";
import { GlobalFraudCheckPreference, newGlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

export function summarizeRewardRuleVariancesForPreference(items: RewardRuleVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveGlobalFraudCheckPreferencesFromVariance(items: RewardRuleVariance[]): GlobalFraudCheckPreference[] {
  const out: GlobalFraudCheckPreference[] = [];
  for (const item of items) {
    const derived = newGlobalFraudCheckPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitGlobalFraudCheckPreference(item: GlobalFraudCheckPreference): string {
  return classifyRewardRuleVariance(item.weightedVolume());
}
