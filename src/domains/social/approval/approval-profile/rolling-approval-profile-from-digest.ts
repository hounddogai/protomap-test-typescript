import { ReplyDigest } from "../../reply/proposal/reply-digest.js";
import { strictReplyProposalBucket } from "../../reply/proposal/strict-reply-proposal-policy.js";
import { RollingApprovalProfile, newRollingApprovalProfile } from "./rolling-approval-profile.js";

export function summarizeReplyDigestsForProfile(items: ReplyDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingApprovalProfilesFromDigest(items: ReplyDigest[]): RollingApprovalProfile[] {
  const out: RollingApprovalProfile[] = [];
  for (const item of items) {
    const derived = newRollingApprovalProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleRollingApprovalProfile(item: RollingApprovalProfile): string {
  return strictReplyProposalBucket(item.weightedTotal());
}
