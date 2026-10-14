import { modelPolicyWeight } from "../../model/policy/model-policy-policy.js";
import { ModelRollup } from "../../model/policy/model-rollup.js";
import { BatchedPathMapping, newBatchedPathMapping } from "./batched-path-mapping.js";

export function summarizeModelRollupsForMapping(items: ModelRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBatchedPathMappingsFromRollup(items: ModelRollup[]): BatchedPathMapping[] {
  const out: BatchedPathMapping[] = [];
  for (const item of items) {
    const derived = newBatchedPathMapping(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedPathMapping(item: BatchedPathMapping): number {
  return modelPolicyWeight(9, true);
}
