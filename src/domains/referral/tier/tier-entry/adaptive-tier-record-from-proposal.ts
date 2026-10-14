import { inviteRuleWeight } from "../../invite/rule/invite-rule-policy.js";
import { PendingInviteProposal } from "../../invite/rule/pending-invite-proposal.js";
import { AdaptiveTierRecord, newAdaptiveTierRecord } from "./adaptive-tier-record.js";

export function summarizePendingInviteProposalsForRecord(items: PendingInviteProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveAdaptiveTierRecordsFromProposal(items: PendingInviteProposal[]): AdaptiveTierRecord[] {
  const out: AdaptiveTierRecord[] = [];
  for (const item of items) {
    const derived = newAdaptiveTierRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveTierRecord(item: AdaptiveTierRecord): number {
  return inviteRuleWeight(8, true);
}
