import { ManualReplyException } from "../../reply/reply-variance/manual-reply-exception.js";
import { weightedReplyVarianceBucket } from "../../reply/reply-variance/weighted-reply-variance-policy.js";
import { LenientApprovalEstimate, newLenientApprovalEstimate } from "./lenient-approval-estimate.js";

export function summarizeManualReplyExceptionsForEstimate(items: ManualReplyException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientApprovalEstimatesFromException(items: ManualReplyException[]): LenientApprovalEstimate[] {
  const out: LenientApprovalEstimate[] = [];
  for (const item of items) {
    const derived = newLenientApprovalEstimate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignLenientApprovalEstimate(item: LenientApprovalEstimate): string {
  return weightedReplyVarianceBucket(item.adjustedValue());
}
