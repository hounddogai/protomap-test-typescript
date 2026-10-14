import { tierEntryWeight } from "../../tier/entry/tier-entry-policy.js";
import { TierMilestone } from "../../tier/entry/tier-milestone.js";
import { RewardRulePreference, newRewardRulePreference } from "./reward-rule-preference.js";

export function summarizeTierMilestonesForPreference(items: TierMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRewardRulePreferencesFromMilestone(items: TierMilestone[]): RewardRulePreference[] {
  const out: RewardRulePreference[] = [];
  for (const item of items) {
    const derived = newRewardRulePreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planRewardRulePreference(item: RewardRulePreference): number {
  return tierEntryWeight(1, true);
}
