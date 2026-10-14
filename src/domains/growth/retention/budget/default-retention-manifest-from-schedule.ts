import {
  normalizeScheduledCohortScheduleCode,
} from "../../cohort/cohort-checkpoint/scheduled-cohort-schedule-policy.js";
import { ScheduledCohortSchedule } from "../../cohort/cohort-checkpoint/scheduled-cohort-schedule.js";
import { DefaultRetentionManifest, newDefaultRetentionManifest } from "./default-retention-manifest.js";

export function summarizeScheduledCohortSchedulesForManifest(items: ScheduledCohortSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveDefaultRetentionManifestsFromSchedule(items: ScheduledCohortSchedule[]): DefaultRetentionManifest[] {
  const out: DefaultRetentionManifest[] = [];
  for (const item of items) {
    const derived = newDefaultRetentionManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultRetentionManifest(item: DefaultRetentionManifest): string {
  return normalizeScheduledCohortScheduleCode(item.code);
}
