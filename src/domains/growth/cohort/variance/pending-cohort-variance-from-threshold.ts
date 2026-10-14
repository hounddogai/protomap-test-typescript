import { classifyScheduledFunnelThreshold } from "../../funnel/funnel-threshold/scheduled-funnel-threshold-policy.js";
import { ScheduledFunnelThreshold } from "../../funnel/funnel-threshold/scheduled-funnel-threshold.js";
import { PendingCohortVariance, newPendingCohortVariance } from "./pending-cohort-variance.js";

export function summarizeScheduledFunnelThresholdsForVariance(items: ScheduledFunnelThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingCohortVariancesFromThreshold(items: ScheduledFunnelThreshold[]): PendingCohortVariance[] {
  const out: PendingCohortVariance[] = [];
  for (const item of items) {
    const derived = newPendingCohortVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingCohortVariance(item: PendingCohortVariance): string {
  return classifyScheduledFunnelThreshold(item.measuredValue());
}
