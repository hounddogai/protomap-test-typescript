import { defaultPayoutOverrideWeight } from "../../payout/proposal/default-payout-override-policy.js";
import { PayoutProposal } from "../../payout/proposal/payout-proposal.js";
import { FallbackRewardRuleBundle, newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

export function summarizePayoutProposalsForBundle(items: PayoutProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveFallbackRewardRuleBundlesFromProposal(items: PayoutProposal[]): FallbackRewardRuleBundle[] {
  const out: FallbackRewardRuleBundle[] = [];
  for (const item of items) {
    const derived = newFallbackRewardRuleBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFallbackRewardRuleBundle(item: FallbackRewardRuleBundle): number {
  return defaultPayoutOverrideWeight(1, true);
}
