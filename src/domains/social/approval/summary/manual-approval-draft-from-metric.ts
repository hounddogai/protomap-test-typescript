import { tieredReplyMetricBucket } from "../../reply/metric/tiered-reply-metric-policy.js";
import { TieredReplyMetric } from "../../reply/metric/tiered-reply-metric.js";
import { ManualApprovalDraft, newManualApprovalDraft } from "./manual-approval-draft.js";

export function summarizeTieredReplyMetricsForDraft(items: TieredReplyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualApprovalDraftsFromMetric(items: TieredReplyMetric[]): ManualApprovalDraft[] {
  const out: ManualApprovalDraft[] = [];
  for (const item of items) {
    const derived = newManualApprovalDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeManualApprovalDraft(item: ManualApprovalDraft): string {
  return tieredReplyMetricBucket(item.projectedExposure());
}
