import { BatchedTouchpointSchedule } from "../../touchpoint/exception/batched-touchpoint-schedule.js";
import { classifyDefaultTouchpointPlan } from "../../touchpoint/exception/default-touchpoint-plan-policy.js";
import { GlobalCreditAllocation, newGlobalCreditAllocation } from "./global-credit-allocation.js";

export function summarizeBatchedTouchpointSchedulesForAllocation(items: BatchedTouchpointSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveGlobalCreditAllocationsFromSchedule(items: BatchedTouchpointSchedule[]): GlobalCreditAllocation[] {
  const out: GlobalCreditAllocation[] = [];
  for (const item of items) {
    const derived = newGlobalCreditAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyGlobalCreditAllocation(item: GlobalCreditAllocation): string {
  return classifyDefaultTouchpointPlan(item.weightedLoad());
}
