import { cohortSlotBucket } from "../../cohort/policy/cohort-slot-policy.js";
import { CohortSlot } from "../../cohort/policy/cohort-slot.js";
import { FallbackActivationAllocation, newFallbackActivationAllocation } from "./fallback-activation-allocation.js";

export function summarizeCohortSlotsForAllocation(items: CohortSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackActivationAllocationsFromSlot(items: CohortSlot[]): FallbackActivationAllocation[] {
  const out: FallbackActivationAllocation[] = [];
  for (const item of items) {
    const derived = newFallbackActivationAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackActivationAllocation(item: FallbackActivationAllocation): string {
  return cohortSlotBucket(item.weightedVolume());
}
