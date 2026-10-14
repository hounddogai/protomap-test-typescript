import { classifyLegacyQueuePolicy } from "../../queue/queue-variance/legacy-queue-policy-policy.js";
import { LegacyQueuePolicy } from "../../queue/queue-variance/legacy-queue-policy.js";
import { BatchedPostQuota, newBatchedPostQuota } from "./batched-post-quota.js";

export function summarizeLegacyQueuePoliciesForQuota(items: LegacyQueuePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedPostQuotasFromPolicy(items: LegacyQueuePolicy[]): BatchedPostQuota[] {
  const out: BatchedPostQuota[] = [];
  for (const item of items) {
    const derived = newBatchedPostQuota(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedPostQuota(item: BatchedPostQuota): string {
  return classifyLegacyQueuePolicy(item.effectiveLoad());
}
