import { FallbackQueueVariance } from "../../queue/entry/fallback-queue-variance.js";
import { lenientQueueEntryBucket } from "../../queue/entry/lenient-queue-entry-policy.js";
import { BatchedPostOverride, newBatchedPostOverride } from "./batched-post-override.js";

export function summarizeFallbackQueueVariancesForOverride(items: FallbackQueueVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedPostOverridesFromVariance(items: FallbackQueueVariance[]): BatchedPostOverride[] {
  const out: BatchedPostOverride[] = [];
  for (const item of items) {
    const derived = newBatchedPostOverride(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankBatchedPostOverride(item: BatchedPostOverride): string {
  return lenientQueueEntryBucket(item.netTotal());
}
