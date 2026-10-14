import { globalInsightReviewBucket } from "../../insight/insight-metric/global-insight-review-policy.js";
import { PendingInsightMetric } from "../../insight/insight-metric/pending-insight-metric.js";
import { ManualReplyException, newManualReplyException } from "./manual-reply-exception.js";

export function summarizePendingInsightMetricsForException(items: PendingInsightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveManualReplyExceptionsFromMetric(items: PendingInsightMetric[]): ManualReplyException[] {
  const out: ManualReplyException[] = [];
  for (const item of items) {
    const derived = newManualReplyException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeManualReplyException(item: ManualReplyException): string {
  return globalInsightReviewBucket(item.weightedLoad());
}
