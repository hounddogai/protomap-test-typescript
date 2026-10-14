import { normalizeCappedBranchPlanCode } from "../plan/capped-branch-plan-policy.js";
import { PendingBranchBaseline } from "../plan/pending-branch-baseline.js";
import { LenientBranchMetric, newLenientBranchMetric } from "./lenient-branch-metric.js";

export function summarizePendingBranchBaselinesForMetric(items: PendingBranchBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLenientBranchMetricsFromBaseline(items: PendingBranchBaseline[]): LenientBranchMetric[] {
  const out: LenientBranchMetric[] = [];
  for (const item of items) {
    const derived = newLenientBranchMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreLenientBranchMetric(item: LenientBranchMetric): string {
  return normalizeCappedBranchPlanCode(item.code);
}
