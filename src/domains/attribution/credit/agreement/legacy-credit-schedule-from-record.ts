import { pendingPathProposalBucket } from "../../path/proposal/pending-path-proposal-policy.js";
import { PendingPathRecord } from "../../path/proposal/pending-path-record.js";
import { LegacyCreditSchedule, newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

export function summarizePendingPathRecordsForSchedule(items: PendingPathRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveLegacyCreditSchedulesFromRecord(items: PendingPathRecord[]): LegacyCreditSchedule[] {
  const out: LegacyCreditSchedule[] = [];
  for (const item of items) {
    const derived = newLegacyCreditSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankLegacyCreditSchedule(item: LegacyCreditSchedule): string {
  return pendingPathProposalBucket(item.weightedLoad());
}
