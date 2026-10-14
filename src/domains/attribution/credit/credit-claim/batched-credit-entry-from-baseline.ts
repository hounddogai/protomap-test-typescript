import {
  normalizeCappedTouchpointSnapshotCode,
} from "../../touchpoint/touchpoint-snapshot/capped-touchpoint-snapshot-policy.js";
import { StrictTouchpointBaseline } from "../../touchpoint/touchpoint-snapshot/strict-touchpoint-baseline.js";
import { BatchedCreditEntry, newBatchedCreditEntry } from "./batched-credit-entry.js";

export function summarizeStrictTouchpointBaselinesForEntry(items: StrictTouchpointBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBatchedCreditEntriesFromBaseline(items: StrictTouchpointBaseline[]): BatchedCreditEntry[] {
  const out: BatchedCreditEntry[] = [];
  for (const item of items) {
    const derived = newBatchedCreditEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleBatchedCreditEntry(item: BatchedCreditEntry): string {
  return normalizeCappedTouchpointSnapshotCode(item.code);
}
