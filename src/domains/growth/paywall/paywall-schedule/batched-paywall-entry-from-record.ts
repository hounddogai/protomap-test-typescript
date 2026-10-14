import { normalizeActivationBaselineCode } from "../../activation/exception/activation-baseline-policy.js";
import { TieredActivationRecord } from "../../activation/exception/tiered-activation-record.js";
import { BatchedPaywallEntry, newBatchedPaywallEntry } from "./batched-paywall-entry.js";

export function summarizeTieredActivationRecordsForEntry(items: TieredActivationRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBatchedPaywallEntriesFromRecord(items: TieredActivationRecord[]): BatchedPaywallEntry[] {
  const out: BatchedPaywallEntry[] = [];
  for (const item of items) {
    const derived = newBatchedPaywallEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedPaywallEntry(item: BatchedPaywallEntry): string {
  return normalizeActivationBaselineCode(item.code);
}
