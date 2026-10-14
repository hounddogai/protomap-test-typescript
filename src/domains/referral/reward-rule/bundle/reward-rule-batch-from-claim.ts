import { RewardRuleClaim } from "../claim/reward-rule-claim.js";
import { classifyRewardRuleReview } from "../claim/reward-rule-review-policy.js";
import { RewardRuleBatch, newRewardRuleBatch } from "./reward-rule-batch.js";

export function summarizeRewardRuleClaimsForBatch(items: RewardRuleClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardRuleBatchesFromClaim(items: RewardRuleClaim[]): RewardRuleBatch[] {
  const out: RewardRuleBatch[] = [];
  for (const item of items) {
    const derived = newRewardRuleBatch(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankRewardRuleBatch(item: RewardRuleBatch): string {
  return classifyRewardRuleReview(item.netVolume());
}
