import { legacyFraudCheckRuleBucket } from "../../fraud-check/check-claim/legacy-fraud-check-rule-policy.js";
import { LegacyFraudCheckRule } from "../../fraud-check/check-claim/legacy-fraud-check-rule.js";
import { AdaptiveRewardRuleBundle, newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

export function summarizeLegacyFraudCheckRulesForBundle(items: LegacyFraudCheckRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveAdaptiveRewardRuleBundlesFromRule(items: LegacyFraudCheckRule[]): AdaptiveRewardRuleBundle[] {
  const out: AdaptiveRewardRuleBundle[] = [];
  for (const item of items) {
    const derived = newAdaptiveRewardRuleBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveRewardRuleBundle(item: AdaptiveRewardRuleBundle): string {
  return legacyFraudCheckRuleBucket(item.netExposure());
}
