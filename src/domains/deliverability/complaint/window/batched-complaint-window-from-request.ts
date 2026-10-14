import { classifyLenientDomainRequest } from "../../domain/domain-mapping/lenient-domain-request-policy.js";
import { LenientDomainRequest } from "../../domain/domain-mapping/lenient-domain-request.js";
import { BatchedComplaintWindow, newBatchedComplaintWindow } from "./batched-complaint-window.js";

export function summarizeLenientDomainRequestsForWindow(items: LenientDomainRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveBatchedComplaintWindowsFromRequest(items: LenientDomainRequest[]): BatchedComplaintWindow[] {
  const out: BatchedComplaintWindow[] = [];
  for (const item of items) {
    const derived = newBatchedComplaintWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeBatchedComplaintWindow(item: BatchedComplaintWindow): string {
  return classifyLenientDomainRequest(item.measuredValue());
}
