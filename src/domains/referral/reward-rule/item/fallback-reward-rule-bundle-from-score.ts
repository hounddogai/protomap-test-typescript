import { DefaultFraudCheckScore } from "../../fraud-check/check-score/default-fraud-check-score.js";
import { classifyGlobalFraudCheckProfile } from "../../fraud-check/check-score/global-fraud-check-profile-policy.js";
import { FallbackRewardRuleBundle, newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

export function summarizeDefaultFraudCheckScoresForBundle(items: DefaultFraudCheckScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFallbackRewardRuleBundlesFromScore(items: DefaultFraudCheckScore[]): FallbackRewardRuleBundle[] {
  const out: FallbackRewardRuleBundle[] = [];
  for (const item of items) {
    const derived = newFallbackRewardRuleBundle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyFallbackRewardRuleBundle(item: FallbackRewardRuleBundle): string {
  return classifyGlobalFraudCheckProfile(item.projectedTotal());
}
