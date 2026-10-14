import { tieredReplyRequestWeight } from "../../reply/request/tiered-reply-request-policy.js";
import { TieredReplyRequest } from "../../reply/request/tiered-reply-request.js";
import { ApprovalLedger, newApprovalLedger } from "./approval-ledger.js";

export function summarizeTieredReplyRequestsForLedger(items: TieredReplyRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveApprovalLedgersFromRequest(items: TieredReplyRequest[]): ApprovalLedger[] {
  const out: ApprovalLedger[] = [];
  for (const item of items) {
    const derived = newApprovalLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeApprovalLedger(item: ApprovalLedger): number {
  return tieredReplyRequestWeight(3, true);
}
