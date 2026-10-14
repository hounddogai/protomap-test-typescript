import { normalizeApprovalBaselineCode } from "../../approval/baseline/approval-baseline-policy.js";
import { RollingApprovalWindow } from "../../approval/baseline/rolling-approval-window.js";
import { QueueQuota, newQueueQuota } from "./queue-quota.js";

export function summarizeRollingApprovalWindowsForQuota(items: RollingApprovalWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveQueueQuotasFromWindow(items: RollingApprovalWindow[]): QueueQuota[] {
  const out: QueueQuota[] = [];
  for (const item of items) {
    const derived = newQueueQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleQueueQuota(item: QueueQuota): string {
  return normalizeApprovalBaselineCode(item.code);
}
