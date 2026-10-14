import { BatchedComplaintEstimate } from "../estimate/batched-complaint-estimate.js";
import { complaintManifestBucket } from "../estimate/complaint-manifest-policy.js";
import { ComplaintVariance, newComplaintVariance } from "./complaint-variance.js";

export function summarizeBatchedComplaintEstimatesForVariance(items: BatchedComplaintEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintVariancesFromEstimate(items: BatchedComplaintEstimate[]): ComplaintVariance[] {
  const out: ComplaintVariance[] = [];
  for (const item of items) {
    const derived = newComplaintVariance(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleComplaintVariance(item: ComplaintVariance): string {
  return complaintManifestBucket(item.netExposure());
}
