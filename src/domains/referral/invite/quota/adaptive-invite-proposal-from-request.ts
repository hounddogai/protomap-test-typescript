import { FallbackRewardRuleRequest } from "../../reward-rule/rule-summary/fallback-reward-rule-request.js";
import {
  classifyRegionalRewardRuleException,
} from "../../reward-rule/rule-summary/regional-reward-rule-exception-policy.js";
import { AdaptiveInviteProposal, newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

export function summarizeFallbackRewardRuleRequestsForProposal(items: FallbackRewardRuleRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveAdaptiveInviteProposalsFromRequest(items: FallbackRewardRuleRequest[]): AdaptiveInviteProposal[] {
  const out: AdaptiveInviteProposal[] = [];
  for (const item of items) {
    const derived = newAdaptiveInviteProposal(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleAdaptiveInviteProposal(item: AdaptiveInviteProposal): string {
  return classifyRegionalRewardRuleException(item.effectiveLoad());
}
