import { approvalMilestoneBucket } from "../../approval/request/approval-milestone-policy.js";
import { ApprovalRequest } from "../../approval/request/approval-request.js";
import { QueueSegment, newQueueSegment } from "./queue-segment.js";

export function summarizeApprovalRequestsForSegment(items: ApprovalRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveQueueSegmentsFromRequest(items: ApprovalRequest[]): QueueSegment[] {
  const out: QueueSegment[] = [];
  for (const item of items) {
    const derived = newQueueSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignQueueSegment(item: QueueSegment): string {
  return approvalMilestoneBucket(item.effectiveTotal());
}
