import { RewardRulePreference } from "../preference/reward-rule-preference.js";
import { rewardRuleRecordBucket } from "../preference/reward-rule-record-policy.js";
import { RewardRuleOverride, newRewardRuleOverride } from "./reward-rule-override.js";

export function summarizeRewardRulePreferencesForOverride(items: RewardRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRewardRuleOverridesFromPreference(items: RewardRulePreference[]): RewardRuleOverride[] {
  const out: RewardRuleOverride[] = [];
  for (const item of items) {
    const derived = newRewardRuleOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRewardRuleOverride(item: RewardRuleOverride): string {
  return rewardRuleRecordBucket(item.effectiveTotal());
}
