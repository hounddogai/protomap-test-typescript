import { cappedCohortScheduleWeight } from "../../cohort/slot/capped-cohort-schedule-policy.js";
import { FallbackCohortSlot } from "../../cohort/slot/fallback-cohort-slot.js";
import { RetentionSchedule, newRetentionSchedule } from "./retention-schedule.js";

export function summarizeFallbackCohortSlotsForSchedule(items: FallbackCohortSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRetentionSchedulesFromSlot(items: FallbackCohortSlot[]): RetentionSchedule[] {
  const out: RetentionSchedule[] = [];
  for (const item of items) {
    const derived = newRetentionSchedule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRetentionSchedule(item: RetentionSchedule): number {
  return cappedCohortScheduleWeight(5, true);
}
