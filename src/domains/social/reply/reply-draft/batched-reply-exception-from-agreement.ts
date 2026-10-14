import { approvalEntryBucket } from "../../approval/approval-agreement/approval-entry-policy.js";
import { PrimaryApprovalAgreement } from "../../approval/approval-agreement/primary-approval-agreement.js";
import { BatchedReplyException, newBatchedReplyException } from "./batched-reply-exception.js";

export function summarizePrimaryApprovalAgreementsForException(items: PrimaryApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBatchedReplyExceptionsFromAgreement(items: PrimaryApprovalAgreement[]): BatchedReplyException[] {
  const out: BatchedReplyException[] = [];
  for (const item of items) {
    const derived = newBatchedReplyException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedReplyException(item: BatchedReplyException): string {
  return approvalEntryBucket(item.adjustedVolume());
}
