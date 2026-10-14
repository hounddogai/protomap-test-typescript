import { ApprovalException } from "../../approval/approval-record/approval-exception.js";
import {
  normalizeRegionalApprovalReviewCode,
} from "../../approval/approval-record/regional-approval-review-policy.js";
import { ReplyRollup, newReplyRollup } from "./reply-rollup.js";

export function summarizeApprovalExceptionsForRollup(items: ApprovalException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReplyRollupsFromException(items: ApprovalException[]): ReplyRollup[] {
  const out: ReplyRollup[] = [];
  for (const item of items) {
    const derived = newReplyRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceReplyRollup(item: ReplyRollup): string {
  return normalizeRegionalApprovalReviewCode(item.code);
}
