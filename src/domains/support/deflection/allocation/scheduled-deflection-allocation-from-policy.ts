import { batchedMacroPolicyWeight } from "../../macro/policy/batched-macro-policy-policy.js";
import { BatchedMacroPolicy } from "../../macro/policy/batched-macro-policy.js";
import {
  ScheduledDeflectionAllocation,
  newScheduledDeflectionAllocation,
} from "./scheduled-deflection-allocation.js";

export function summarizeBatchedMacroPoliciesForAllocation(items: BatchedMacroPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveScheduledDeflectionAllocationsFromPolicy(items: BatchedMacroPolicy[]): ScheduledDeflectionAllocation[] {
  const out: ScheduledDeflectionAllocation[] = [];
  for (const item of items) {
    const derived = newScheduledDeflectionAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planScheduledDeflectionAllocation(item: ScheduledDeflectionAllocation): number {
  return batchedMacroPolicyWeight(2, true);
}
