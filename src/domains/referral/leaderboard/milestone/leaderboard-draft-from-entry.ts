import { RewardRuleEntry } from "../../reward-rule/policy/reward-rule-entry.js";
import { rewardRulePolicyWeight } from "../../reward-rule/policy/reward-rule-policy-policy.js";
import { LeaderboardDraft, newLeaderboardDraft } from "./leaderboard-draft.js";

export function summarizeRewardRuleEntriesForDraft(items: RewardRuleEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveLeaderboardDraftsFromEntry(items: RewardRuleEntry[]): LeaderboardDraft[] {
  const out: LeaderboardDraft[] = [];
  for (const item of items) {
    const derived = newLeaderboardDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLeaderboardDraft(item: LeaderboardDraft): number {
  return rewardRulePolicyWeight(9, true);
}
