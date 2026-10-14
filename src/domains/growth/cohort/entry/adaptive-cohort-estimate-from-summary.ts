import { tieredFunnelSummaryBucket } from "../../funnel/assignment/tiered-funnel-summary-policy.js";
import { TieredFunnelSummary } from "../../funnel/assignment/tiered-funnel-summary.js";
import { AdaptiveCohortEstimate, newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

export function summarizeTieredFunnelSummariesForEstimate(items: TieredFunnelSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveAdaptiveCohortEstimatesFromSummary(items: TieredFunnelSummary[]): AdaptiveCohortEstimate[] {
  const out: AdaptiveCohortEstimate[] = [];
  for (const item of items) {
    const derived = newAdaptiveCohortEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeAdaptiveCohortEstimate(item: AdaptiveCohortEstimate): string {
  return tieredFunnelSummaryBucket(item.measuredValue());
}
