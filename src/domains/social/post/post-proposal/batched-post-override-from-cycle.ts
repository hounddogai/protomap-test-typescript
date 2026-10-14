import { classifyCappedMentionThreshold } from "../../mention/mention-cycle/capped-mention-threshold-policy.js";
import { WeightedMentionCycle } from "../../mention/mention-cycle/weighted-mention-cycle.js";
import { BatchedPostOverride, newBatchedPostOverride } from "./batched-post-override.js";

export function summarizeWeightedMentionCyclesForOverride(items: WeightedMentionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedPostOverridesFromCycle(items: WeightedMentionCycle[]): BatchedPostOverride[] {
  const out: BatchedPostOverride[] = [];
  for (const item of items) {
    const derived = newBatchedPostOverride(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planBatchedPostOverride(item: BatchedPostOverride): string {
  return classifyCappedMentionThreshold(item.netTotal());
}
