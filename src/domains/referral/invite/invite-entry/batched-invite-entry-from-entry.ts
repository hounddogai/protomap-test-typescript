import { globalTierEntryWeight } from "../../tier/tier-entry/global-tier-entry-policy.js";
import { GlobalTierEntry } from "../../tier/tier-entry/global-tier-entry.js";
import { BatchedInviteEntry, newBatchedInviteEntry } from "./batched-invite-entry.js";

export function summarizeGlobalTierEntriesForEntry(items: GlobalTierEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveBatchedInviteEntriesFromEntry(items: GlobalTierEntry[]): BatchedInviteEntry[] {
  const out: BatchedInviteEntry[] = [];
  for (const item of items) {
    const derived = newBatchedInviteEntry(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateBatchedInviteEntry(item: BatchedInviteEntry): number {
  return globalTierEntryWeight(7, true);
}
