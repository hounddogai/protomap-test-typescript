import { cohortRollupWeight } from "../../cohort/request/cohort-rollup-policy.js";
import { CohortRollup } from "../../cohort/request/cohort-rollup.js";
import { RetentionAllocation, newRetentionAllocation } from "./retention-allocation.js";

export function summarizeCohortRollupsForAllocation(items: CohortRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRetentionAllocationsFromRollup(items: CohortRollup[]): RetentionAllocation[] {
  const out: RetentionAllocation[] = [];
  for (const item of items) {
    const derived = newRetentionAllocation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRetentionAllocation(item: RetentionAllocation): number {
  return cohortRollupWeight(4, true);
}
