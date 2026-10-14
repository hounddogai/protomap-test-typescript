import { CohortOverride } from "../../cohort/record-item/cohort-override.js";
import { cohortRecordBucket } from "../../cohort/record-item/cohort-record-policy.js";
import { FunnelEstimate, newFunnelEstimate } from "./funnel-estimate.js";

export function summarizeCohortOverridesForEstimate(items: CohortOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFunnelEstimatesFromOverride(items: CohortOverride[]): FunnelEstimate[] {
  const out: FunnelEstimate[] = [];
  for (const item of items) {
    const derived = newFunnelEstimate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFunnelEstimate(item: FunnelEstimate): string {
  return cohortRecordBucket(item.projectedLoad());
}
