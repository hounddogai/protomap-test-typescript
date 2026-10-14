import { RollingPostRollup } from "../../post/rollup/rolling-post-rollup.js";
import { classifyTieredPostRollup } from "../../post/rollup/tiered-post-rollup-policy.js";
import { QueueAllocation, newQueueAllocation } from "./queue-allocation.js";

export function summarizeRollingPostRollupsForAllocation(items: RollingPostRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveQueueAllocationsFromRollup(items: RollingPostRollup[]): QueueAllocation[] {
  const out: QueueAllocation[] = [];
  for (const item of items) {
    const derived = newQueueAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchQueueAllocation(item: QueueAllocation): string {
  return classifyTieredPostRollup(item.effectiveVolume());
}
