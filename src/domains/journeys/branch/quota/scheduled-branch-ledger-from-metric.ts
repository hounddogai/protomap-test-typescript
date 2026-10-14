import { classifyBatchedExitRuleMetric } from "../../exit-rule/rule-notice/batched-exit-rule-metric-policy.js";
import { BatchedExitRuleMetric } from "../../exit-rule/rule-notice/batched-exit-rule-metric.js";
import { ScheduledBranchLedger, newScheduledBranchLedger } from "./scheduled-branch-ledger.js";

export function summarizeBatchedExitRuleMetricsForLedger(items: BatchedExitRuleMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveScheduledBranchLedgersFromMetric(items: BatchedExitRuleMetric[]): ScheduledBranchLedger[] {
  const out: ScheduledBranchLedger[] = [];
  for (const item of items) {
    const derived = newScheduledBranchLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledBranchLedger(item: ScheduledBranchLedger): string {
  return classifyBatchedExitRuleMetric(item.weightedValue());
}
