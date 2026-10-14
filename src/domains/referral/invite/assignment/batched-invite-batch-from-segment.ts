import { rewardRuleSegmentWeight } from "../../reward-rule/rule-preference/reward-rule-segment-policy.js";
import { RewardRuleSegment } from "../../reward-rule/rule-preference/reward-rule-segment.js";
import { BatchedInviteBatch, newBatchedInviteBatch } from "./batched-invite-batch.js";

export function summarizeRewardRuleSegmentsForBatch(items: RewardRuleSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBatchedInviteBatchesFromSegment(items: RewardRuleSegment[]): BatchedInviteBatch[] {
  const out: BatchedInviteBatch[] = [];
  for (const item of items) {
    const derived = newBatchedInviteBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBatchedInviteBatch(item: BatchedInviteBatch): number {
  return rewardRuleSegmentWeight(9, true);
}
