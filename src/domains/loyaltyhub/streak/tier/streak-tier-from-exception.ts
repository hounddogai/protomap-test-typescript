import { batchedStreakExceptionBucket } from "../streak-exception/batched-streak-exception-policy.js";
import { BatchedStreakException } from "../streak-exception/batched-streak-exception.js";
import { StreakTier, newStreakTier } from "./streak-tier.js";

export function summarizeBatchedStreakExceptionsForTier(items: BatchedStreakException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStreakTiersFromException(items: BatchedStreakException[]): StreakTier[] {
  const out: StreakTier[] = [];
  for (const item of items) {
    const derived = newStreakTier(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planStreakTier(item: StreakTier): string {
  return batchedStreakExceptionBucket(item.projectedLoad());
}
