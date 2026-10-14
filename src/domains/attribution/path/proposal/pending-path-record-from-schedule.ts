import { weightedCreditScheduleWeight } from "../../credit/target/weighted-credit-schedule-policy.js";
import { WeightedCreditSchedule } from "../../credit/target/weighted-credit-schedule.js";
import { PendingPathRecord, newPendingPathRecord } from "./pending-path-record.js";

export function summarizeWeightedCreditSchedulesForRecord(items: WeightedCreditSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePendingPathRecordsFromSchedule(items: WeightedCreditSchedule[]): PendingPathRecord[] {
  const out: PendingPathRecord[] = [];
  for (const item of items) {
    const derived = newPendingPathRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingPathRecord(item: PendingPathRecord): number {
  return weightedCreditScheduleWeight(7, true);
}
