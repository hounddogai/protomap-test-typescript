import { batchedRewardRulePolicyBucket } from "../../reward-rule/claim/batched-reward-rule-policy-policy.js";
import { BatchedRewardRulePolicy } from "../../reward-rule/claim/batched-reward-rule-policy.js";
import { LeaderboardSlot, newLeaderboardSlot } from "./leaderboard-slot.js";

export function summarizeBatchedRewardRulePoliciesForSlot(items: BatchedRewardRulePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveLeaderboardSlotsFromPolicy(items: BatchedRewardRulePolicy[]): LeaderboardSlot[] {
  const out: LeaderboardSlot[] = [];
  for (const item of items) {
    const derived = newLeaderboardSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLeaderboardSlot(item: LeaderboardSlot): string {
  return batchedRewardRulePolicyBucket(item.effectiveValue());
}
