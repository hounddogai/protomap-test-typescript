import { ApprovalMetric } from "../summary/approval-metric.js";
import { classifyManualApprovalDraft } from "../summary/manual-approval-draft-policy.js";
import { ApprovalSchedule, newApprovalSchedule } from "./approval-schedule.js";

export function summarizeApprovalMetricsForSchedule(items: ApprovalMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveApprovalSchedulesFromMetric(items: ApprovalMetric[]): ApprovalSchedule[] {
  const out: ApprovalSchedule[] = [];
  for (const item of items) {
    const derived = newApprovalSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveApprovalSchedule(item: ApprovalSchedule): string {
  return classifyManualApprovalDraft(item.adjustedTotal());
}
