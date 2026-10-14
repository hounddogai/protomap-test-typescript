import { normalizePostAllocationCode } from "../../post/milestone/post-allocation-policy.js";
import { PostAllocation } from "../../post/milestone/post-allocation.js";
import { ApprovalRequest, newApprovalRequest } from "./approval-request.js";

export function summarizePostAllocationsForRequest(items: PostAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveApprovalRequestsFromAllocation(items: PostAllocation[]): ApprovalRequest[] {
  const out: ApprovalRequest[] = [];
  for (const item of items) {
    const derived = newApprovalRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeApprovalRequest(item: ApprovalRequest): string {
  return normalizePostAllocationCode(item.code);
}
