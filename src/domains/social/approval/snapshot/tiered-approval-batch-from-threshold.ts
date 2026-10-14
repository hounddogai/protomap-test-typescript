import { adaptiveReplyThresholdBucket } from "../../reply/notice/adaptive-reply-threshold-policy.js";
import { AdaptiveReplyThreshold } from "../../reply/notice/adaptive-reply-threshold.js";
import { TieredApprovalBatch, newTieredApprovalBatch } from "./tiered-approval-batch.js";

export function summarizeAdaptiveReplyThresholdsForBatch(items: AdaptiveReplyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredApprovalBatchesFromThreshold(items: AdaptiveReplyThreshold[]): TieredApprovalBatch[] {
  const out: TieredApprovalBatch[] = [];
  for (const item of items) {
    const derived = newTieredApprovalBatch(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateTieredApprovalBatch(item: TieredApprovalBatch): string {
  return adaptiveReplyThresholdBucket(item.adjustedLoad());
}
