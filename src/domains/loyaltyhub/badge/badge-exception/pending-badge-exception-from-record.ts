import { regionalStreakRecordBucket } from "../../streak/manifest/regional-streak-record-policy.js";
import { RegionalStreakRecord } from "../../streak/manifest/regional-streak-record.js";
import { PendingBadgeException, newPendingBadgeException } from "./pending-badge-exception.js";

export function summarizeRegionalStreakRecordsForException(items: RegionalStreakRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePendingBadgeExceptionsFromRecord(items: RegionalStreakRecord[]): PendingBadgeException[] {
  const out: PendingBadgeException[] = [];
  for (const item of items) {
    const derived = newPendingBadgeException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scorePendingBadgeException(item: PendingBadgeException): string {
  return regionalStreakRecordBucket(item.adjustedValue());
}
