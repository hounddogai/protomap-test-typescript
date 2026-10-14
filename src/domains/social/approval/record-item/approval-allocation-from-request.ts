import { insightRequestBucket } from "../../insight/estimate/insight-request-policy.js";
import { InsightRequest } from "../../insight/estimate/insight-request.js";
import { ApprovalAllocation, newApprovalAllocation } from "./approval-allocation.js";

export function summarizeInsightRequestsForAllocation(items: InsightRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveApprovalAllocationsFromRequest(items: InsightRequest[]): ApprovalAllocation[] {
  const out: ApprovalAllocation[] = [];
  for (const item of items) {
    const derived = newApprovalAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveApprovalAllocation(item: ApprovalAllocation): string {
  return insightRequestBucket(item.netExposure());
}
