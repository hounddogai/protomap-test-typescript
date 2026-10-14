import { globalFraudCheckSummaryWeight } from "../../fraud-check/score/global-fraud-check-summary-policy.js";
import { LenientFraudCheckScore } from "../../fraud-check/score/lenient-fraud-check-score.js";
import { RewardRuleEstimate, newRewardRuleEstimate } from "./reward-rule-estimate.js";

export function summarizeLenientFraudCheckScoresForEstimate(items: LenientFraudCheckScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRewardRuleEstimatesFromScore(items: LenientFraudCheckScore[]): RewardRuleEstimate[] {
  const out: RewardRuleEstimate[] = [];
  for (const item of items) {
    const derived = newRewardRuleEstimate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRewardRuleEstimate(item: RewardRuleEstimate): number {
  return globalFraudCheckSummaryWeight(9, true);
}
