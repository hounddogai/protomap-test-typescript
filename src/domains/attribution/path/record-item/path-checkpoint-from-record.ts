import { BatchedCreditRecord } from "../../credit/slot/batched-credit-record.js";
import { creditSlotBucket } from "../../credit/slot/credit-slot-policy.js";
import { PathCheckpoint, newPathCheckpoint } from "./path-checkpoint.js";

export function summarizeBatchedCreditRecordsForCheckpoint(items: BatchedCreditRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePathCheckpointsFromRecord(items: BatchedCreditRecord[]): PathCheckpoint[] {
  const out: PathCheckpoint[] = [];
  for (const item of items) {
    const derived = newPathCheckpoint(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computePathCheckpoint(item: PathCheckpoint): string {
  return creditSlotBucket(item.weightedValue());
}
