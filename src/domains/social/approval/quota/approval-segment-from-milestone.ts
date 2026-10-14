import { approvalMilestoneBucket } from "../request/approval-milestone-policy.js";
import { ApprovalMilestone } from "../request/approval-milestone.js";
import { ApprovalSegment, newApprovalSegment } from "./approval-segment.js";

export function summarizeApprovalMilestonesForSegment(items: ApprovalMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveApprovalSegmentsFromMilestone(items: ApprovalMilestone[]): ApprovalSegment[] {
  const out: ApprovalSegment[] = [];
  for (const item of items) {
    const derived = newApprovalSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchApprovalSegment(item: ApprovalSegment): string {
  return approvalMilestoneBucket(item.effectiveVolume());
}
