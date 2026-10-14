import { cohortCycleBucket } from "../../cohort/cohort-checkpoint/cohort-cycle-policy.js";
import { ScheduledCohortSchedule } from "../../cohort/cohort-checkpoint/scheduled-cohort-schedule.js";
import { PrimaryPaywallManifest, newPrimaryPaywallManifest } from "./primary-paywall-manifest.js";

export function summarizeScheduledCohortSchedulesForManifest(items: ScheduledCohortSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePrimaryPaywallManifestsFromSchedule(items: ScheduledCohortSchedule[]): PrimaryPaywallManifest[] {
  const out: PrimaryPaywallManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryPaywallManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryPaywallManifest(item: PrimaryPaywallManifest): string {
  return cohortCycleBucket(item.measuredValue());
}
