import { levelEstimateWeight } from "../../level/batched-level-cycle/level-estimate-policy.js";
import { LevelEstimate } from "../../level/batched-level-cycle/level-estimate.js";
import { AdaptiveStreakProposal, newAdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

export function summarizeLevelEstimatesForProposal(items: LevelEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveAdaptiveStreakProposalsFromEstimate(items: LevelEstimate[]): AdaptiveStreakProposal[] {
  const out: AdaptiveStreakProposal[] = [];
  for (const item of items) {
    const derived = newAdaptiveStreakProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceAdaptiveStreakProposal(item: AdaptiveStreakProposal): number {
  return levelEstimateWeight(3, true);
}
