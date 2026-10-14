import { classifyDefaultRewardSegment } from "../../reward/reward-entry/default-reward-segment-policy.js";
import { DefaultRewardSegment } from "../../reward/reward-entry/default-reward-segment.js";
import { AdaptiveChallengeProposal, newAdaptiveChallengeProposal } from "./adaptive-challenge-proposal.js";

export function summarizeDefaultRewardSegmentsForProposal(items: DefaultRewardSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveAdaptiveChallengeProposalsFromSegment(items: DefaultRewardSegment[]): AdaptiveChallengeProposal[] {
  const out: AdaptiveChallengeProposal[] = [];
  for (const item of items) {
    const derived = newAdaptiveChallengeProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveChallengeProposal(item: AdaptiveChallengeProposal): string {
  return classifyDefaultRewardSegment(item.netExposure());
}
