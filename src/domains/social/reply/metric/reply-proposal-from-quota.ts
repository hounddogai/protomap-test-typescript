import { BatchedApprovalQuota } from "../../approval/estimate/batched-approval-quota.js";
import { tieredApprovalEstimateBucket } from "../../approval/estimate/tiered-approval-estimate-policy.js";
import { ReplyProposal, newReplyProposal } from "./reply-proposal.js";

export function summarizeBatchedApprovalQuotasForProposal(items: BatchedApprovalQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReplyProposalsFromQuota(items: BatchedApprovalQuota[]): ReplyProposal[] {
  const out: ReplyProposal[] = [];
  for (const item of items) {
    const derived = newReplyProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceReplyProposal(item: ReplyProposal): string {
  return tieredApprovalEstimateBucket(item.effectiveValue());
}
