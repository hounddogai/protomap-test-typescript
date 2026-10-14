import { rewardRuleDraftWeight } from "../../reward-rule/draft/reward-rule-draft-policy.js";
import { RewardRuleDraft } from "../../reward-rule/draft/reward-rule-draft.js";
import { AdaptiveFraudCheckScore, newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

export function summarizeRewardRuleDraftsForScore(items: RewardRuleDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveAdaptiveFraudCheckScoresFromDraft(items: RewardRuleDraft[]): AdaptiveFraudCheckScore[] {
  const out: AdaptiveFraudCheckScore[] = [];
  for (const item of items) {
    const derived = newAdaptiveFraudCheckScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateAdaptiveFraudCheckScore(item: AdaptiveFraudCheckScore): number {
  return rewardRuleDraftWeight(6, true);
}
