import {
  normalizeManualRewardRuleAdjustmentCode,
} from "../../reward-rule/draft/manual-reward-rule-adjustment-policy.js";
import { RewardRuleProposal } from "../../reward-rule/draft/reward-rule-proposal.js";
import { PrimaryLeaderboardBundle, newPrimaryLeaderboardBundle } from "./primary-leaderboard-bundle.js";

export function summarizeRewardRuleProposalsForBundle(items: RewardRuleProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePrimaryLeaderboardBundlesFromProposal(items: RewardRuleProposal[]): PrimaryLeaderboardBundle[] {
  const out: PrimaryLeaderboardBundle[] = [];
  for (const item of items) {
    const derived = newPrimaryLeaderboardBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPrimaryLeaderboardBundle(item: PrimaryLeaderboardBundle): string {
  return normalizeManualRewardRuleAdjustmentCode(item.code);
}
