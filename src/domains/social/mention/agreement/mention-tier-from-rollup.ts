import { approvalAssignmentWeight } from "../../approval/rollup/approval-assignment-policy.js";
import { ApprovalRollup } from "../../approval/rollup/approval-rollup.js";
import { MentionTier, newMentionTier } from "./mention-tier.js";

export function summarizeApprovalRollupsForTier(items: ApprovalRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveMentionTiersFromRollup(items: ApprovalRollup[]): MentionTier[] {
  const out: MentionTier[] = [];
  for (const item of items) {
    const derived = newMentionTier(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyMentionTierExtra(item: MentionTier): number {
  return approvalAssignmentWeight(4, true);
}
