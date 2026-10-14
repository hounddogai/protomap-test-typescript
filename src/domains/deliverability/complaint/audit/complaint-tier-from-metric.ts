import { classifyCappedComplaintTarget } from "../complaint-metric/capped-complaint-target-policy.js";
import { ManualComplaintMetric } from "../complaint-metric/manual-complaint-metric.js";
import { ComplaintTier, newComplaintTier } from "./complaint-tier.js";

export function summarizeManualComplaintMetricsForTier(items: ManualComplaintMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintTiersFromMetric(items: ManualComplaintMetric[]): ComplaintTier[] {
  const out: ComplaintTier[] = [];
  for (const item of items) {
    const derived = newComplaintTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitComplaintTier(item: ComplaintTier): string {
  return classifyCappedComplaintTarget(item.netTotal());
}
