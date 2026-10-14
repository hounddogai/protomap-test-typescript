import { classifyAdaptiveStreakProposal } from "../request/adaptive-streak-proposal-policy.js";
import { RegionalStreakSchedule } from "../request/regional-streak-schedule.js";
import { RegionalStreakRecord, newRegionalStreakRecord } from "./regional-streak-record.js";

export function summarizeRegionalStreakSchedulesForRecord(items: RegionalStreakSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRegionalStreakRecordsFromSchedule(items: RegionalStreakSchedule[]): RegionalStreakRecord[] {
  const out: RegionalStreakRecord[] = [];
  for (const item of items) {
    const derived = newRegionalStreakRecord(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRegionalStreakRecord(item: RegionalStreakRecord): string {
  return classifyAdaptiveStreakProposal(item.weightedValue());
}
