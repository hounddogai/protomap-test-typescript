import { classifyCappedModelGroup } from "../../model/request/capped-model-group-policy.js";
import { CappedModelGroup } from "../../model/request/capped-model-group.js";
import { BatchedCreditRule, newBatchedCreditRule } from "./batched-credit-rule.js";

export function summarizeCappedModelGroupsForRule(items: CappedModelGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveBatchedCreditRulesFromGroup(items: CappedModelGroup[]): BatchedCreditRule[] {
  const out: BatchedCreditRule[] = [];
  for (const item of items) {
    const derived = newBatchedCreditRule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileBatchedCreditRule(item: BatchedCreditRule): string {
  return classifyCappedModelGroup(item.effectiveTotal());
}
