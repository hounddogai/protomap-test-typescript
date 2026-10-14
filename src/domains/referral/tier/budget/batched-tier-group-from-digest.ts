import { GlobalRewardRuleDigest } from "../../reward-rule/notice/global-reward-rule-digest.js";
import { manualRewardRuleDraftBucket } from "../../reward-rule/notice/manual-reward-rule-draft-policy.js";
import { BatchedTierGroup, newBatchedTierGroup } from "./batched-tier-group.js";

export function summarizeGlobalRewardRuleDigestsForGroup(items: GlobalRewardRuleDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedTierGroupsFromDigest(items: GlobalRewardRuleDigest[]): BatchedTierGroup[] {
  const out: BatchedTierGroup[] = [];
  for (const item of items) {
    const derived = newBatchedTierGroup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedTierGroup(item: BatchedTierGroup): string {
  return manualRewardRuleDraftBucket(item.weightedValue());
}
