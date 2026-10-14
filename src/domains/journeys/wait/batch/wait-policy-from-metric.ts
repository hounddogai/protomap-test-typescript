import { classifyBranchMetric } from "../../branch/entry/branch-metric-policy.js";
import { BranchMetric } from "../../branch/entry/branch-metric.js";
import { WaitPolicy, newWaitPolicy } from "./wait-policy.js";

export function summarizeBranchMetricsForPolicy(items: BranchMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWaitPoliciesFromMetric(items: BranchMetric[]): WaitPolicy[] {
  const out: WaitPolicy[] = [];
  for (const item of items) {
    const derived = newWaitPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeWaitPolicy(item: WaitPolicy): string {
  return classifyBranchMetric(item.effectiveExposure());
}
