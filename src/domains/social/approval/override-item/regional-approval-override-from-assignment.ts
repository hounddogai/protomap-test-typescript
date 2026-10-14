import { ReplyAssignment } from "../../reply/claim/reply-assignment.js";
import { replyTierBucket } from "../../reply/claim/reply-tier-policy.js";
import { RegionalApprovalOverride, newRegionalApprovalOverride } from "./regional-approval-override.js";

export function summarizeReplyAssignmentsForOverride(items: ReplyAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRegionalApprovalOverridesFromAssignment(items: ReplyAssignment[]): RegionalApprovalOverride[] {
  const out: RegionalApprovalOverride[] = [];
  for (const item of items) {
    const derived = newRegionalApprovalOverride(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeRegionalApprovalOverride(item: RegionalApprovalOverride): string {
  return replyTierBucket(item.adjustedExposure());
}
