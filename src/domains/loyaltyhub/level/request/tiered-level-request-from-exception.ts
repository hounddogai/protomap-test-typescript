import { batchedStreakExceptionBucket } from "../../streak/streak-exception/batched-streak-exception-policy.js";
import { BatchedStreakException } from "../../streak/streak-exception/batched-streak-exception.js";
import { TieredLevelRequest, newTieredLevelRequest } from "./tiered-level-request.js";

export function summarizeBatchedStreakExceptionsForRequest(items: BatchedStreakException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredLevelRequestsFromException(items: BatchedStreakException[]): TieredLevelRequest[] {
  const out: TieredLevelRequest[] = [];
  for (const item of items) {
    const derived = newTieredLevelRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyTieredLevelRequest(item: TieredLevelRequest): string {
  return batchedStreakExceptionBucket(item.measuredValue());
}
