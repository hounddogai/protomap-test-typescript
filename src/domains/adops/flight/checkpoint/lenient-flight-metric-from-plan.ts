import { manualFlightPlanWeight } from "../plan/manual-flight-plan-policy.js";
import { ManualFlightPlan } from "../plan/manual-flight-plan.js";
import { LenientFlightMetric, newLenientFlightMetric } from "./lenient-flight-metric.js";

export function summarizeManualFlightPlansForMetric(items: ManualFlightPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLenientFlightMetricsFromPlan(items: ManualFlightPlan[]): LenientFlightMetric[] {
  const out: LenientFlightMetric[] = [];
  for (const item of items) {
    const derived = newLenientFlightMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeLenientFlightMetric(item: LenientFlightMetric): number {
  return manualFlightPlanWeight(6, true);
}
