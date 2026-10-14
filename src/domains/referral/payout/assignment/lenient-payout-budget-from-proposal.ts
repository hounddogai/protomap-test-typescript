import { classifyInviteClaim } from "../../invite/entry/invite-claim-policy.js";
import { InviteProposal } from "../../invite/entry/invite-proposal.js";
import { LenientPayoutBudget, newLenientPayoutBudget } from "./lenient-payout-budget.js";

export function summarizeInviteProposalsForBudget(items: InviteProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLenientPayoutBudgetsFromProposal(items: InviteProposal[]): LenientPayoutBudget[] {
  const out: LenientPayoutBudget[] = [];
  for (const item of items) {
    const derived = newLenientPayoutBudget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveLenientPayoutBudget(item: LenientPayoutBudget): string {
  return classifyInviteClaim(item.projectedExposure());
}
