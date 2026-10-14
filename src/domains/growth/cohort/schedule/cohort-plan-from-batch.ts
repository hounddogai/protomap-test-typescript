import { funnelBatchWeight } from "../../funnel/batch/funnel-batch-policy.js";
import { FunnelBatch } from "../../funnel/batch/funnel-batch.js";
import { CohortPlan, newCohortPlan } from "./cohort-plan.js";

export function summarizeFunnelBatchesForPlan(items: FunnelBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortPlansFromBatch(items: FunnelBatch[]): CohortPlan[] {
  const out: CohortPlan[] = [];
  for (const item of items) {
    const derived = newCohortPlan(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateCohortPlan(item: CohortPlan): number {
  return funnelBatchWeight(3, true);
}
