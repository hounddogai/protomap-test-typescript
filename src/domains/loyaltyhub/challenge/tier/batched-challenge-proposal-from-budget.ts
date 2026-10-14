import { WeightedRewardBudget } from "../../reward/reward-budget/weighted-reward-budget.js";
import { classifyWeightedRewardEntry } from "../../reward/reward-budget/weighted-reward-entry-policy.js";
import { BatchedChallengeProposal, newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

export function summarizeWeightedRewardBudgetsForProposal(items: WeightedRewardBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveBatchedChallengeProposalsFromBudget(items: WeightedRewardBudget[]): BatchedChallengeProposal[] {
  const out: BatchedChallengeProposal[] = [];
  for (const item of items) {
    const derived = newBatchedChallengeProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeBatchedChallengeProposal(item: BatchedChallengeProposal): string {
  return classifyWeightedRewardEntry(item.effectiveVolume());
}
