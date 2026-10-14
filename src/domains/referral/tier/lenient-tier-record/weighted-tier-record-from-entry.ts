import { normalizeBatchedInviteEntryCode } from "../../invite/invite-entry/batched-invite-entry-policy.js";
import { BatchedInviteEntry } from "../../invite/invite-entry/batched-invite-entry.js";
import { WeightedTierRecord, newWeightedTierRecord } from "./weighted-tier-record.js";

export function summarizeBatchedInviteEntriesForRecord(items: BatchedInviteEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWeightedTierRecordsFromEntry(items: BatchedInviteEntry[]): WeightedTierRecord[] {
  const out: WeightedTierRecord[] = [];
  for (const item of items) {
    const derived = newWeightedTierRecord(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceWeightedTierRecord(item: WeightedTierRecord): string {
  return normalizeBatchedInviteEntryCode(item.code);
}
