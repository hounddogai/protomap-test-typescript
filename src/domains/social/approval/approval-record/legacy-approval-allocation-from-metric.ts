import { classifyInsightMetric } from "../../insight/metric/insight-metric-policy.js";
import { InsightMetric } from "../../insight/metric/insight-metric.js";
import { LegacyApprovalAllocation, newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

export function summarizeInsightMetricsForAllocation(items: InsightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLegacyApprovalAllocationsFromMetric(items: InsightMetric[]): LegacyApprovalAllocation[] {
  const out: LegacyApprovalAllocation[] = [];
  for (const item of items) {
    const derived = newLegacyApprovalAllocation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLegacyApprovalAllocation(item: LegacyApprovalAllocation): string {
  return classifyInsightMetric(item.projectedVolume());
}
