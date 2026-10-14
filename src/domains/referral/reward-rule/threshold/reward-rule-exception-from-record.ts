import { weightedTierRecordWeight } from "../../tier/lenient-tier-record/weighted-tier-record-policy.js";
import { WeightedTierRecord } from "../../tier/lenient-tier-record/weighted-tier-record.js";
import { RewardRuleException, newRewardRuleException } from "./reward-rule-exception.js";

export function summarizeWeightedTierRecordsForException(items: WeightedTierRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRewardRuleExceptionsFromRecord(items: WeightedTierRecord[]): RewardRuleException[] {
  const out: RewardRuleException[] = [];
  for (const item of items) {
    const derived = newRewardRuleException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRewardRuleException(item: RewardRuleException): number {
  return weightedTierRecordWeight(7, true);
}
