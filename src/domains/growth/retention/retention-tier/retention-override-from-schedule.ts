import { manualActivationScheduleWeight } from "../../activation/preference/manual-activation-schedule-policy.js";
import { ManualActivationSchedule } from "../../activation/preference/manual-activation-schedule.js";
import { RetentionOverride, newRetentionOverride } from "./retention-override.js";

export function summarizeManualActivationSchedulesForOverride(items: ManualActivationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveRetentionOverridesFromSchedule(items: ManualActivationSchedule[]): RetentionOverride[] {
  const out: RetentionOverride[] = [];
  for (const item of items) {
    const derived = newRetentionOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRetentionOverride(item: RetentionOverride): number {
  return manualActivationScheduleWeight(7, true);
}
