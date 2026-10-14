import { waitEstimateBucket } from "../../wait/wait-budget/wait-estimate-policy.js";
import { WaitEstimate } from "../../wait/wait-budget/wait-estimate.js";
import { CappedBranchMetric, newCappedBranchMetric } from "./capped-branch-metric.js";

export function summarizeWaitEstimatesForMetric(items: WaitEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveCappedBranchMetricsFromEstimate(items: WaitEstimate[]): CappedBranchMetric[] {
  const out: CappedBranchMetric[] = [];
  for (const item of items) {
    const derived = newCappedBranchMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCappedBranchMetric(item: CappedBranchMetric): string {
  return waitEstimateBucket(item.effectiveTotal());
}
