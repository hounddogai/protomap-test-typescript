import { classifyPendingRewardProposal } from "../../reward/rule/pending-reward-proposal-policy.js";
import { PendingRewardProposal } from "../../reward/rule/pending-reward-proposal.js";
import { ChallengeProfile, newChallengeProfile } from "./challenge-profile.js";

export function summarizePendingRewardProposalsForProfile(items: PendingRewardProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveChallengeProfilesFromProposal(items: PendingRewardProposal[]): ChallengeProfile[] {
  const out: ChallengeProfile[] = [];
  for (const item of items) {
    const derived = newChallengeProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyChallengeProfile(item: ChallengeProfile): string {
  return classifyPendingRewardProposal(item.measuredValue());
}
