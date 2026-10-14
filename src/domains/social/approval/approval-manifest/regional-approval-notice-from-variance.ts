import { approvalVarianceWeight } from "../preference/approval-variance-policy.js";
import { ApprovalVariance } from "../preference/approval-variance.js";
import { RegionalApprovalNotice, newRegionalApprovalNotice } from "./regional-approval-notice.js";

export function summarizeApprovalVariancesForNotice(items: ApprovalVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveRegionalApprovalNoticesFromVariance(items: ApprovalVariance[]): RegionalApprovalNotice[] {
  const out: RegionalApprovalNotice[] = [];
  for (const item of items) {
    const derived = newRegionalApprovalNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRegionalApprovalNotice(item: RegionalApprovalNotice): number {
  return approvalVarianceWeight(7, true);
}
