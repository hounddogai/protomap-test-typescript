import { exitRuleAuditBucket } from "../../exit-rule/audit/exit-rule-audit-policy.js";
import { RegionalExitRuleTarget } from "../../exit-rule/audit/regional-exit-rule-target.js";
import { BatchedWaitPolicy, newBatchedWaitPolicy } from "./batched-wait-policy.js";

export function summarizeRegionalExitRuleTargetsForPolicy(items: RegionalExitRuleTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedWaitPoliciesFromTarget(items: RegionalExitRuleTarget[]): BatchedWaitPolicy[] {
  const out: BatchedWaitPolicy[] = [];
  for (const item of items) {
    const derived = newBatchedWaitPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankBatchedWaitPolicy(item: BatchedWaitPolicy): string {
  return exitRuleAuditBucket(item.measuredValue());
}
