import { PendingApprovalAllocation } from "../../approval/profile/pending-approval-allocation.js";
import { normalizeRollingApprovalDigestCode } from "../../approval/profile/rolling-approval-digest-policy.js";
import { ReplyDigest, newReplyDigest } from "./reply-digest.js";

export function summarizePendingApprovalAllocationsForDigest(items: PendingApprovalAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveReplyDigestsFromAllocation(items: PendingApprovalAllocation[]): ReplyDigest[] {
  const out: ReplyDigest[] = [];
  for (const item of items) {
    const derived = newReplyDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planReplyDigest(item: ReplyDigest): string {
  return normalizeRollingApprovalDigestCode(item.code);
}
