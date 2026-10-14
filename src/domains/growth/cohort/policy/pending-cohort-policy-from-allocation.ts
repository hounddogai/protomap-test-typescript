import { normalizeActivationAllocationCode } from "../../activation/allocation/activation-allocation-policy.js";
import { ActivationAllocation } from "../../activation/allocation/activation-allocation.js";
import { PendingCohortPolicy, newPendingCohortPolicy } from "./pending-cohort-policy.js";

export function summarizeActivationAllocationsForPolicy(items: ActivationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePendingCohortPoliciesFromAllocation(items: ActivationAllocation[]): PendingCohortPolicy[] {
  const out: PendingCohortPolicy[] = [];
  for (const item of items) {
    const derived = newPendingCohortPolicy(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPendingCohortPolicy(item: PendingCohortPolicy): string {
  return normalizeActivationAllocationCode(item.code);
}
