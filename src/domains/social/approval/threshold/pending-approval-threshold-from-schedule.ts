import { classifyLenientPostSnapshot } from "../../post/post-schedule/lenient-post-snapshot-policy.js";
import { TieredPostSchedule } from "../../post/post-schedule/tiered-post-schedule.js";
import { PendingApprovalThreshold, newPendingApprovalThreshold } from "./pending-approval-threshold.js";

export function summarizeTieredPostSchedulesForThreshold(items: TieredPostSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePendingApprovalThresholdsFromSchedule(items: TieredPostSchedule[]): PendingApprovalThreshold[] {
  const out: PendingApprovalThreshold[] = [];
  for (const item of items) {
    const derived = newPendingApprovalThreshold(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePendingApprovalThreshold(item: PendingApprovalThreshold): string {
  return classifyLenientPostSnapshot(item.projectedValue());
}
