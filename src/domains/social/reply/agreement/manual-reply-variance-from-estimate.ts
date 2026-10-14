import { ScheduledQueueEstimate } from "../../queue/queue-estimate/scheduled-queue-estimate.js";
import { strictQueueTargetBucket } from "../../queue/queue-estimate/strict-queue-target-policy.js";
import { ManualReplyVariance, newManualReplyVariance } from "./manual-reply-variance.js";

export function summarizeScheduledQueueEstimatesForVariance(items: ScheduledQueueEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveManualReplyVariancesFromEstimate(items: ScheduledQueueEstimate[]): ManualReplyVariance[] {
  const out: ManualReplyVariance[] = [];
  for (const item of items) {
    const derived = newManualReplyVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeManualReplyVariance(item: ManualReplyVariance): string {
  return strictQueueTargetBucket(item.netExposure());
}
