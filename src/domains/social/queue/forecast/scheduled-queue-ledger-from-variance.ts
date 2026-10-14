import { normalizeApprovalVarianceCode } from "../../approval/preference/approval-variance-policy.js";
import { ApprovalVariance } from "../../approval/preference/approval-variance.js";
import { ScheduledQueueLedger, newScheduledQueueLedger } from "./scheduled-queue-ledger.js";

export function summarizeApprovalVariancesForLedger(items: ApprovalVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveScheduledQueueLedgersFromVariance(items: ApprovalVariance[]): ScheduledQueueLedger[] {
  const out: ScheduledQueueLedger[] = [];
  for (const item of items) {
    const derived = newScheduledQueueLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectScheduledQueueLedger(item: ScheduledQueueLedger): string {
  return normalizeApprovalVarianceCode(item.code);
}
