import { fallbackCreditScheduleWeight } from "../metric/fallback-credit-schedule-policy.js";
import { FallbackCreditSchedule } from "../metric/fallback-credit-schedule.js";
import { CappedCreditSegment, newCappedCreditSegment } from "./capped-credit-segment.js";

export function summarizeFallbackCreditSchedulesForSegment(items: FallbackCreditSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveCappedCreditSegmentsFromSchedule(items: FallbackCreditSchedule[]): CappedCreditSegment[] {
  const out: CappedCreditSegment[] = [];
  for (const item of items) {
    const derived = newCappedCreditSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitCappedCreditSegment(item: CappedCreditSegment): number {
  return fallbackCreditScheduleWeight(1, true);
}
