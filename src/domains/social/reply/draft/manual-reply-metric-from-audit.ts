import { GlobalApprovalAudit } from "../../approval/override-item/global-approval-audit.js";
import { regionalApprovalOverrideBucket } from "../../approval/override-item/regional-approval-override-policy.js";
import { ManualReplyMetric, newManualReplyMetric } from "./manual-reply-metric.js";

export function summarizeGlobalApprovalAuditsForMetric(items: GlobalApprovalAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveManualReplyMetricsFromAudit(items: GlobalApprovalAudit[]): ManualReplyMetric[] {
  const out: ManualReplyMetric[] = [];
  for (const item of items) {
    const derived = newManualReplyMetric(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyManualReplyMetric(item: ManualReplyMetric): string {
  return regionalApprovalOverrideBucket(item.adjustedValue());
}
