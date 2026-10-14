import { BatchedCreditOverride } from "../../credit/group/batched-credit-override.js";
import { classifyCreditGroup } from "../../credit/group/credit-group-policy.js";
import { CappedPathAllocation, newCappedPathAllocation } from "./capped-path-allocation.js";

export function summarizeBatchedCreditOverridesForAllocation(items: BatchedCreditOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedPathAllocationsFromOverride(items: BatchedCreditOverride[]): CappedPathAllocation[] {
  const out: CappedPathAllocation[] = [];
  for (const item of items) {
    const derived = newCappedPathAllocation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCappedPathAllocation(item: CappedPathAllocation): string {
  return classifyCreditGroup(item.projectedLoad());
}
