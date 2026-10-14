import { AdaptiveRewardRuleProposal } from "../../reward-rule/metric/adaptive-reward-rule-proposal.js";
import { legacyRewardRuleLedgerBucket } from "../../reward-rule/metric/legacy-reward-rule-ledger-policy.js";
import { GlobalInvitePolicy, newGlobalInvitePolicy } from "./global-invite-policy.js";

export function summarizeAdaptiveRewardRuleProposalsForPolicy(items: AdaptiveRewardRuleProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveGlobalInvitePoliciesFromProposal(items: AdaptiveRewardRuleProposal[]): GlobalInvitePolicy[] {
  const out: GlobalInvitePolicy[] = [];
  for (const item of items) {
    const derived = newGlobalInvitePolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalInvitePolicy(item: GlobalInvitePolicy): string {
  return legacyRewardRuleLedgerBucket(item.adjustedLoad());
}
