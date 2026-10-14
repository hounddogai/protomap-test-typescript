import { BatchedApprovalQuota } from "../../approval/estimate/batched-approval-quota.js";
import { tieredApprovalEstimateBucket } from "../../approval/estimate/tiered-approval-estimate-policy.js";
import { ManualQueueSchedule, newManualQueueSchedule } from "./manual-queue-schedule.js";

export function summarizeBatchedApprovalQuotasForSchedule(items: BatchedApprovalQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualQueueSchedulesFromQuota(items: BatchedApprovalQuota[]): ManualQueueSchedule[] {
  const out: ManualQueueSchedule[] = [];
  for (const item of items) {
    const derived = newManualQueueSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualQueueSchedule(item: ManualQueueSchedule): string {
  return tieredApprovalEstimateBucket(item.adjustedExposure());
}
