import { classifyBatchedStreakRecord } from "../streak-snapshot/batched-streak-record-policy.js";
import { BatchedStreakRecord } from "../streak-snapshot/batched-streak-record.js";
import { FallbackStreakTarget, newFallbackStreakTarget } from "./fallback-streak-target.js";

export function summarizeBatchedStreakRecordsForTarget(items: BatchedStreakRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFallbackStreakTargetsFromRecord(items: BatchedStreakRecord[]): FallbackStreakTarget[] {
  const out: FallbackStreakTarget[] = [];
  for (const item of items) {
    const derived = newFallbackStreakTarget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackStreakTarget(item: FallbackStreakTarget): string {
  return classifyBatchedStreakRecord(item.effectiveLoad());
}
